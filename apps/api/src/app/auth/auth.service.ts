import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ValidationUtils } from '@simple-pos/shared/utils';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { getTenantPlanConfig, normalizeTenantPlan } from '../tenants/tenant-plan.config';
import { AuthResponse, AuthTenantResponse, AuthUserResponse, RegisterRequestDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { getJwtRefreshSecret } from './jwt-config';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  tenantId: string;
  active: boolean;
}

const PERMISSIONS_BY_ROLE: Record<string, string[]> = {
  ADMIN: [
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'reports:read',
    'settings:update',
  ],
  CASHIER: ['products:read', 'orders:create', 'orders:read', 'orders:update', 'tables:read'],
  KITCHEN: ['products:read', 'orders:read', 'orders:update', 'kitchen:read'],
  DRIVER: ['orders:read', 'delivery:read'],
  SUPER_ADMIN: [
    'admin:tenants:read',
    'admin:tenants:update',
    'admin:billing:read',
    'admin:billing:update',
    'admin:analytics:read',
    'admin:usage:read',
  ],
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_EXPIRY = '30d';
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private readonly refreshTokens = new Map<string, { userId: string; expiresAt: number }>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {
    this.cleanupTimer = setInterval(() => this.cleanupExpiredTokens(), this.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let removed = 0;
    for (const [token, stored] of this.refreshTokens) {
      if (stored.expiresAt < now) {
        this.refreshTokens.delete(token);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Cleaned up ${removed} expired refresh token(s)`);
    }
  }

  async login(email: string, password: string, tenantId?: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, password, tenantId);
    const permissions = this.resolvePermissions(user.role);
    const tokens = await this.generateTokens(user, permissions);

    return {
      ...tokens,
      user: this.mapUserResponse(user),
      permissions,
    };
  }

  async register(registerDto: RegisterRequestDto): Promise<AuthResponse> {
    this.validateRegisterDto(registerDto);

    const normalizedSubdomain = this.normalizeSubdomain(registerDto.subdomain);
    const normalizedPlan = normalizeTenantPlan('FREE');
    const planConfig = getTenantPlanConfig(normalizedPlan);

    const [existingTenant, existingUser] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: {
          subdomain: normalizedSubdomain,
        },
        select: {
          id: true,
        },
      }),
      this.prisma.user.findUnique({
        where: {
          email: registerDto.email.toLowerCase(),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingTenant) {
      throw new ConflictException(`Subdomain '${normalizedSubdomain}' is already in use`);
    }

    if (existingUser) {
      throw new ConflictException(`Email '${registerDto.email}' is already registered`);
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const apiKeyBundle = await this.generateApiKeyBundle();
    const trialEndsAt = new Date(Date.now() + planConfig.trialDays * 24 * 60 * 60 * 1000);

    const { tenant, user, apiKey } = await this.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: registerDto.businessName.trim(),
          subdomain: normalizedSubdomain,
          plan: normalizedPlan,
          status: 'TRIAL',
          trialEndsAt,
          maxUsers: planConfig.maxUsers,
          maxLocations: planConfig.maxLocations,
          maxDevices: planConfig.maxDevices,
          features: planConfig.features,
          settings: {
            timezone: registerDto.timezone ?? 'UTC',
            currency: registerDto.currency ?? 'USD',
            language: registerDto.language ?? 'en',
            taxRate: registerDto.taxRate ?? 0,
          },
          billingInfo: {
            email: registerDto.email.toLowerCase(),
          },
        },
      });

      const createdUser = await tx.user.create({
        data: {
          tenantId: createdTenant.id,
          email: registerDto.email.toLowerCase(),
          firstName: registerDto.ownerFirstName.trim(),
          lastName: registerDto.ownerLastName.trim(),
          role: 'ADMIN',
          password: passwordHash,
        },
      });

      const createdApiKey = await tx.tenantApiKey.create({
        data: {
          tenantId: createdTenant.id,
          name: 'default',
          keyPrefix: apiKeyBundle.keyPrefix,
          keyHash: apiKeyBundle.keyHash,
        },
      });

      return {
        tenant: createdTenant,
        user: createdUser,
        apiKey: createdApiKey,
      };
    });

    const storedUser = this.toStoredUser(user);
    const permissions = this.resolvePermissions(storedUser.role);
    const tokens = await this.generateTokens(storedUser, permissions);

    return {
      ...tokens,
      user: this.mapUserResponse(storedUser),
      tenant: this.mapTenantResponse(tenant),
      permissions,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKeyBundle.rawKey,
        keyPrefix: apiKey.keyPrefix,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const stored = this.refreshTokens.get(refreshToken);
    if (!stored || stored.expiresAt < Date.now()) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    this.refreshTokens.delete(refreshToken);

    const user = await this.findUserById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions = this.resolvePermissions(user.role);
    const tokens = await this.generateTokens(user, permissions);

    return {
      ...tokens,
      user: this.mapUserResponse(user),
      permissions,
    };
  }

  async getProfile(userId: string): Promise<AuthUserResponse> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.mapUserResponse(user);
  }

  logout(refreshToken?: string): void {
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }
  }

  async validatePayload(payload: JwtPayload): Promise<StoredUser | null> {
    return this.findUserById(payload.sub);
  }

  private async validateUser(
    email: string,
    password: string,
    tenantId?: string,
  ): Promise<StoredUser> {
    if (tenantId && !ValidationUtils.isUuid(tenantId)) {
      throw new BadRequestException('Invalid tenant context');
    }

    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (tenantId && user.tenantId !== tenantId) {
      throw new UnauthorizedException('Invalid tenant context for provided credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password login is not enabled for this user');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  private async generateTokens(
    user: StoredUser,
    permissions: string[],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      permissions,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshTokenSecret(),
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
  }

  private mapUserResponse(user: StoredUser): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  private mapTenantResponse(tenant: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    trialEndsAt: Date | null;
  }): AuthTenantResponse {
    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt?.toISOString(),
    };
  }

  private validateRegisterDto(registerDto: RegisterRequestDto): void {
    if (!registerDto.businessName?.trim()) {
      throw new BadRequestException('Business name is required');
    }

    if (!registerDto.subdomain?.trim()) {
      throw new BadRequestException('Subdomain is required');
    }

    if (!registerDto.ownerFirstName?.trim() || !registerDto.ownerLastName?.trim()) {
      throw new BadRequestException('Owner first and last name are required');
    }

    if (!registerDto.email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    if (!registerDto.password || registerDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (registerDto.taxRate !== undefined && registerDto.taxRate < 0) {
      throw new BadRequestException('Tax rate cannot be negative');
    }
  }

  private normalizeSubdomain(subdomain: string): string {
    const normalized = subdomain.trim().toLowerCase();

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
      throw new BadRequestException(
        'Subdomain can only contain lowercase letters, numbers, and single hyphens',
      );
    }

    if (normalized.length < 3 || normalized.length > 63) {
      throw new BadRequestException('Subdomain length must be between 3 and 63 characters');
    }

    return normalized;
  }

  private async generateApiKeyBundle(): Promise<{
    rawKey: string;
    keyPrefix: string;
    keyHash: string;
  }> {
    const rawKey = `spk_${randomBytes(24).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 12);
    const keyHash = await bcrypt.hash(rawKey, 10);
    return {
      rawKey,
      keyPrefix,
      keyHash,
    };
  }

  private resolvePermissions(role: string): string[] {
    return PERMISSIONS_BY_ROLE[role] ?? [];
  }

  getRefreshTokenSecret(): string {
    return getJwtRefreshSecret();
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    return this.toStoredUser(user);
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.toStoredUser(user);
  }

  private toStoredUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string | null;
    role: string;
    tenantId: string;
  }): StoredUser {
    const fullName = `${user.firstName} ${user.lastName}`.trim();

    return {
      id: user.id,
      name: fullName || user.email,
      email: user.email,
      passwordHash: user.password ?? '',
      role: user.role,
      tenantId: user.tenantId,
      active: true,
    };
  }
}
