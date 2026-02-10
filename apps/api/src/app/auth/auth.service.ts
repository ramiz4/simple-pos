import { Injectable, Logger, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthResponse, AuthUserResponse } from './dto';
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

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, password);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.mapUserResponse(user),
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

    // Remove old refresh token
    this.refreshTokens.delete(refreshToken);

    const user = await this.findUserById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.mapUserResponse(user),
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

  private async validateUser(email: string, password: string): Promise<StoredUser> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshTokenSecret(),
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    // Store refresh token with expiry (30 days)
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

  getRefreshTokenSecret(): string {
    return getJwtRefreshSecret();
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
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
