import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthResponse, AuthUserResponse } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { getJwtRefreshSecret } from './jwt-config';

interface StoredUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  accountId: number;
  active: boolean;
}

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_EXPIRY = '30d';
  private readonly refreshTokens = new Map<string, { userId: number; expiresAt: number }>();

  constructor(private readonly jwtService: JwtService) {}

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

  async getProfile(userId: number): Promise<AuthUserResponse> {
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
      accountId: user.accountId,
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
      accountId: user.accountId,
    };
  }

  getRefreshTokenSecret(): string {
    return getJwtRefreshSecret();
  }

  /**
   * Placeholder: Find user by email from data store.
   * In a full implementation, this would query a database (e.g., PostgreSQL via TypeORM/Prisma).
   * Currently returns null — to be wired to a real UserRepository in a future sprint.
   */
  // istanbul ignore next
  async findUserByEmail(_email: string): Promise<StoredUser | null> {
    return null;
  }

  /**
   * Placeholder: Find user by ID from data store.
   * In a full implementation, this would query a database (e.g., PostgreSQL via TypeORM/Prisma).
   * Currently returns null — to be wired to a real UserRepository in a future sprint.
   */
  // istanbul ignore next
  async findUserById(_id: number): Promise<StoredUser | null> {
    return null;
  }
}
