import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { AuthResponse } from '../auth/dto';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateSsoProviderDto,
  OauthAuthorizeRequestDto,
  SsoClaimMappingDto,
  SsoSamlAssertionDto,
  UpdateSsoProviderDto,
} from './dto';

const SUPPORTED_PROTOCOLS = ['SAML', 'OAUTH2'] as const;
type SupportedProtocol = (typeof SUPPORTED_PROTOCOLS)[number];

const INTERNAL_ROLE_VALUES = ['ADMIN', 'CASHIER', 'KITCHEN', 'DRIVER', 'SUPER_ADMIN'] as const;
type InternalRole = (typeof INTERNAL_ROLE_VALUES)[number];

type RoleMappings = Record<string, string[]>;

interface OAuthStateContext {
  tenantId: string;
  providerId: string;
  redirectUri: string;
  expiresAt: number;
}

interface NormalizedSsoUser {
  email: string;
  firstName: string;
  lastName: string;
  externalRoles: string[];
}

interface OAuthTokenResponse {
  accessToken: string;
}

interface JsonObject {
  [key: string]: unknown;
}

@Injectable()
export class SsoService {
  private readonly oauthStateTtlMs = 10 * 60 * 1000;
  private readonly oauthStateStore = new Map<string, OAuthStateContext>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async listProviders(tenantId: string) {
    const providers = await this.prisma.ssoProvider.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        protocol: true,
        enabled: true,
        authorizationUrl: true,
        tokenUrl: true,
        userInfoUrl: true,
        issuer: true,
        entryPoint: true,
        callbackUrl: true,
        clientId: true,
        clientSecret: true,
        scopes: true,
        roleMappings: true,
        claimMapping: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return providers.map((provider) => ({
      ...provider,
      hasClientSecret: Boolean(provider.clientSecret),
      clientSecret: undefined,
    }));
  }

  async createProvider(tenantId: string, dto: CreateSsoProviderDto) {
    const protocol = this.normalizeProtocol(dto.protocol);
    const slug = this.normalizeSlug(dto.slug ?? dto.name);

    await this.ensureProviderSlugAvailable(tenantId, slug);
    this.validateProtocolConfig(protocol, dto, false);

    const created = await this.prisma.ssoProvider.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        slug,
        protocol,
        enabled: dto.enabled ?? true,
        authorizationUrl: this.normalizeOptionalUrl(dto.authorizationUrl),
        tokenUrl: this.normalizeOptionalUrl(dto.tokenUrl),
        userInfoUrl: this.normalizeOptionalUrl(dto.userInfoUrl),
        issuer: this.normalizeOptionalText(dto.issuer),
        entryPoint: this.normalizeOptionalUrl(dto.entryPoint),
        callbackUrl: this.normalizeOptionalUrl(dto.callbackUrl),
        clientId: this.normalizeOptionalText(dto.clientId),
        clientSecret: this.normalizeOptionalText(dto.clientSecret),
        scopes: this.normalizeScopes(dto.scopes),
        roleMappings: this.normalizeRoleMappings(dto.roleMappings),
        claimMapping: this.normalizeClaimMapping(dto.claimMapping),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        protocol: true,
        enabled: true,
        authorizationUrl: true,
        tokenUrl: true,
        userInfoUrl: true,
        issuer: true,
        entryPoint: true,
        callbackUrl: true,
        clientId: true,
        scopes: true,
        roleMappings: true,
        claimMapping: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...created,
      hasClientSecret: Boolean(dto.clientSecret),
    };
  }

  async updateProvider(tenantId: string, providerId: string, dto: UpdateSsoProviderDto) {
    const existing = await this.findTenantProvider(tenantId, providerId);

    const protocol = dto.protocol
      ? this.normalizeProtocol(dto.protocol)
      : this.normalizeProtocol(existing.protocol);
    const slug = dto.slug ? this.normalizeSlug(dto.slug) : existing.slug;

    if (slug !== existing.slug) {
      await this.ensureProviderSlugAvailable(tenantId, slug);
    }

    this.validateProtocolConfig(
      protocol,
      {
        ...existing,
        ...dto,
      },
      true,
    );

    const updated = await this.prisma.ssoProvider.update({
      where: {
        id: providerId,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.protocol !== undefined ? { protocol } : {}),
        ...(dto.slug !== undefined ? { slug } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.authorizationUrl !== undefined
          ? { authorizationUrl: this.normalizeOptionalUrl(dto.authorizationUrl) }
          : {}),
        ...(dto.tokenUrl !== undefined
          ? { tokenUrl: this.normalizeOptionalUrl(dto.tokenUrl) }
          : {}),
        ...(dto.userInfoUrl !== undefined
          ? { userInfoUrl: this.normalizeOptionalUrl(dto.userInfoUrl) }
          : {}),
        ...(dto.issuer !== undefined ? { issuer: this.normalizeOptionalText(dto.issuer) } : {}),
        ...(dto.entryPoint !== undefined
          ? { entryPoint: this.normalizeOptionalUrl(dto.entryPoint) }
          : {}),
        ...(dto.callbackUrl !== undefined
          ? { callbackUrl: this.normalizeOptionalUrl(dto.callbackUrl) }
          : {}),
        ...(dto.clientId !== undefined
          ? { clientId: this.normalizeOptionalText(dto.clientId) }
          : {}),
        ...(dto.clientSecret !== undefined
          ? { clientSecret: this.normalizeOptionalText(dto.clientSecret) }
          : {}),
        ...(dto.scopes !== undefined ? { scopes: this.normalizeScopes(dto.scopes) } : {}),
        ...(dto.roleMappings !== undefined
          ? { roleMappings: this.normalizeRoleMappings(dto.roleMappings) }
          : {}),
        ...(dto.claimMapping !== undefined
          ? { claimMapping: this.normalizeClaimMapping(dto.claimMapping) }
          : {}),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        protocol: true,
        enabled: true,
        authorizationUrl: true,
        tokenUrl: true,
        userInfoUrl: true,
        issuer: true,
        entryPoint: true,
        callbackUrl: true,
        clientId: true,
        clientSecret: true,
        scopes: true,
        roleMappings: true,
        claimMapping: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      hasClientSecret: Boolean(updated.clientSecret),
      clientSecret: undefined,
    };
  }

  async deleteProvider(tenantId: string, providerId: string) {
    await this.findTenantProvider(tenantId, providerId);

    await this.prisma.ssoProvider.delete({
      where: {
        id: providerId,
      },
    });

    return {
      deleted: true,
      providerId,
    };
  }

  async createOauthAuthorizationUrl(
    tenantId: string,
    providerId: string,
    dto: OauthAuthorizeRequestDto,
  ) {
    this.cleanupExpiredStates();

    const provider = await this.findTenantProvider(tenantId, providerId);
    this.assertOauthProvider(provider);

    const redirectUri = this.resolveRedirectUri(dto.redirectUri, provider.callbackUrl);

    const state = randomBytes(24).toString('hex');
    const expiresAt = Date.now() + this.oauthStateTtlMs;
    this.oauthStateStore.set(state, {
      tenantId,
      providerId,
      redirectUri,
      expiresAt,
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: provider.scopes.join(' '),
      state,
    });

    return {
      providerId,
      protocol: provider.protocol,
      authorizationUrl: `${provider.authorizationUrl}?${params.toString()}`,
      state,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async oauthCallback(providerId: string, code: string, state: string): Promise<AuthResponse> {
    this.cleanupExpiredStates();

    if (!code?.trim()) {
      throw new BadRequestException('OAuth callback code is required');
    }

    if (!state?.trim()) {
      throw new BadRequestException('OAuth callback state is required');
    }

    const stateContext = this.oauthStateStore.get(state);
    this.oauthStateStore.delete(state);

    if (!stateContext || stateContext.expiresAt < Date.now()) {
      throw new UnauthorizedException('OAuth state is invalid or expired');
    }

    if (stateContext.providerId !== providerId) {
      throw new UnauthorizedException('OAuth state does not match provider context');
    }

    const provider = await this.findTenantProvider(stateContext.tenantId, providerId);
    this.assertOauthProvider(provider);
    const claimMapping = this.extractClaimMapping(provider.claimMapping);

    const tokenResponse = await this.exchangeOAuthCode(provider, code, stateContext.redirectUri);
    const profile = await this.fetchOAuthProfile(provider, tokenResponse.accessToken, claimMapping);

    return this.authenticateFromProfile(
      provider.tenantId,
      profile,
      claimMapping,
      this.extractRoleMappings(provider.roleMappings),
    );
  }

  async samlAssertion(
    providerId: string,
    dto: SsoSamlAssertionDto,
    sharedSecret?: string,
  ): Promise<AuthResponse> {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: {
        id: providerId,
      },
    });

    if (!provider || provider.protocol !== 'SAML' || !provider.enabled) {
      throw new NotFoundException('Enabled SAML provider not found');
    }

    if (dto.tenantId && dto.tenantId !== provider.tenantId) {
      throw new UnauthorizedException('SAML assertion tenant mismatch');
    }

    if (provider.clientSecret && provider.clientSecret !== (sharedSecret ?? '')) {
      throw new UnauthorizedException('Invalid SSO assertion shared secret');
    }

    const normalizedProfile: NormalizedSsoUser = {
      email: dto.email,
      firstName: dto.firstName ?? dto.subject ?? 'SSO',
      lastName: dto.lastName ?? 'User',
      externalRoles: this.normalizeExternalRoles(dto.roles),
    };

    return this.authenticateFromProfile(
      provider.tenantId,
      normalizedProfile,
      this.extractClaimMapping(provider.claimMapping),
      this.extractRoleMappings(provider.roleMappings),
    );
  }

  private async exchangeOAuthCode(
    provider: {
      tokenUrl: string;
      clientId: string;
      clientSecret: string | null;
      scopes: string[];
    },
    code: string,
    redirectUri: string,
  ): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: provider.clientId,
      ...(provider.clientSecret ? { client_secret: provider.clientSecret } : {}),
      ...(provider.scopes.length > 0 ? { scope: provider.scopes.join(' ') } : {}),
    });

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = (await this.safeReadJson(response)) as {
      access_token?: string;
      [key: string]: unknown;
    };

    if (!response.ok) {
      throw new UnauthorizedException(
        `OAuth token exchange failed with status ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    const accessToken = payload.access_token?.trim();
    if (!accessToken) {
      throw new UnauthorizedException('OAuth provider did not return an access token');
    }

    return {
      accessToken,
    };
  }

  private async fetchOAuthProfile(
    provider: { userInfoUrl: string },
    accessToken: string,
    claimMapping: SsoClaimMappingDto,
  ): Promise<NormalizedSsoUser> {
    const response = await fetch(provider.userInfoUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await this.safeReadJson(response)) as JsonObject;

    if (!response.ok) {
      throw new UnauthorizedException(
        `OAuth profile request failed with status ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    return this.normalizeOAuthProfile(payload, claimMapping);
  }

  private async authenticateFromProfile(
    tenantId: string,
    profile: NormalizedSsoUser,
    claimMapping: SsoClaimMappingDto,
    roleMappings: RoleMappings,
  ): Promise<AuthResponse> {
    const normalizedEmail = profile.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new UnauthorizedException('SSO profile did not provide an email address');
    }

    if (
      claimMapping.allowedEmailDomain &&
      !normalizedEmail.endsWith(`@${claimMapping.allowedEmailDomain}`)
    ) {
      throw new UnauthorizedException('Email domain is not allowed for this SSO provider');
    }

    const resolvedRole = this.resolveRole(
      profile.externalRoles,
      roleMappings,
      claimMapping.defaultRole,
    );
    const shouldAutoProvision = claimMapping.autoProvisionUsers ?? true;
    const shouldSyncRole = claimMapping.syncRoleOnLogin ?? true;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser && existingUser.tenantId !== tenantId) {
      throw new UnauthorizedException('User belongs to a different tenant');
    }

    if (!existingUser && !shouldAutoProvision) {
      throw new UnauthorizedException('User is not provisioned in this tenant');
    }

    const firstName = profile.firstName.trim() || normalizedEmail;
    const lastName = profile.lastName.trim() || 'User';

    const user = existingUser
      ? await this.prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            firstName,
            lastName,
            ...(shouldSyncRole ? { role: resolvedRole } : {}),
          },
        })
      : await this.prisma.user.create({
          data: {
            tenantId,
            email: normalizedEmail,
            firstName,
            lastName,
            role: resolvedRole,
            password: null,
          },
        });

    return this.authService.issueSessionForUserId(user.id);
  }

  private normalizeOAuthProfile(
    payload: JsonObject,
    claimMapping: SsoClaimMappingDto | undefined,
  ): NormalizedSsoUser {
    const emailClaim = claimMapping?.emailClaim;
    const firstNameClaim = claimMapping?.firstNameClaim;
    const lastNameClaim = claimMapping?.lastNameClaim;
    const rolesClaim = claimMapping?.rolesClaim;

    const email = this.readStringClaim(payload, emailClaim, ['email', 'mail', 'upn']);
    const firstName = this.readStringClaim(payload, firstNameClaim, ['given_name', 'first_name']);
    const lastName = this.readStringClaim(payload, lastNameClaim, ['family_name', 'last_name']);
    const rolesRaw = this.readClaim(payload, rolesClaim, ['roles', 'groups']);

    return {
      email,
      firstName: firstName || 'SSO',
      lastName: lastName || 'User',
      externalRoles: this.normalizeExternalRoles(rolesRaw),
    };
  }

  private readClaim(
    payload: JsonObject,
    explicitClaim: string | undefined,
    fallbackClaims: string[],
  ): unknown {
    const claimPaths = explicitClaim ? [explicitClaim] : fallbackClaims;

    for (const claimPath of claimPaths) {
      if (!claimPath?.trim()) {
        continue;
      }

      const parts = claimPath
        .split('.')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length === 0) {
        continue;
      }

      let cursor: unknown = payload;
      for (const part of parts) {
        if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
          cursor = undefined;
          break;
        }

        cursor = (cursor as JsonObject)[part];
      }

      if (cursor !== undefined && cursor !== null) {
        return cursor;
      }
    }

    return undefined;
  }

  private readStringClaim(
    payload: JsonObject,
    explicitClaim: string | undefined,
    fallbackClaims: string[],
  ): string {
    const raw = this.readClaim(payload, explicitClaim, fallbackClaims);
    if (typeof raw === 'string') {
      return raw.trim();
    }

    return '';
  }

  private normalizeExternalRoles(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim());
    }

    if (typeof raw === 'string') {
      return raw
        .split(/[\s,;|]+/)
        .map((role) => role.trim())
        .filter(Boolean);
    }

    return [];
  }

  private resolveRole(
    externalRoles: string[],
    roleMappings: RoleMappings,
    fallbackRole: string | undefined,
  ): InternalRole {
    const normalizedExternalRoles = new Set(externalRoles.map((role) => role.toLowerCase()));

    for (const [internalRole, aliases] of Object.entries(roleMappings)) {
      const hasMatch = aliases.some((alias) => normalizedExternalRoles.has(alias.toLowerCase()));
      if (hasMatch) {
        return this.normalizeInternalRole(internalRole);
      }
    }

    return this.normalizeInternalRole(fallbackRole);
  }

  private normalizeInternalRole(role: string | undefined): InternalRole {
    const normalized = role?.trim().toUpperCase() ?? 'CASHIER';
    if (INTERNAL_ROLE_VALUES.includes(normalized as InternalRole)) {
      return normalized as InternalRole;
    }

    return 'CASHIER';
  }

  private extractRoleMappings(raw: unknown): RoleMappings {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }

    const mappingEntries = Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value
            .filter((entry): entry is string => typeof entry === 'string')
            .map((entry) => entry.trim())
        : [],
    ]);

    return Object.fromEntries(mappingEntries.filter(([, value]) => value.length > 0));
  }

  private extractClaimMapping(raw: unknown): SsoClaimMappingDto {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }

    return raw as SsoClaimMappingDto;
  }

  private normalizeRoleMappings(
    mapping: Record<string, string[]> | undefined,
  ): Prisma.InputJsonValue {
    if (!mapping) {
      return {};
    }

    const normalized = Object.fromEntries(
      Object.entries(mapping)
        .map(([internalRole, externalRoles]) => [
          this.normalizeInternalRole(internalRole),
          this.normalizeExternalRoles(externalRoles),
        ])
        .filter(([, externalRoles]) => externalRoles.length > 0),
    ) as Prisma.InputJsonObject;

    return normalized;
  }

  private normalizeClaimMapping(mapping: SsoClaimMappingDto | undefined): Prisma.InputJsonValue {
    if (!mapping) {
      return {};
    }

    const normalized: Prisma.InputJsonObject = {
      ...(mapping.emailClaim ? { emailClaim: mapping.emailClaim.trim() } : {}),
      ...(mapping.firstNameClaim ? { firstNameClaim: mapping.firstNameClaim.trim() } : {}),
      ...(mapping.lastNameClaim ? { lastNameClaim: mapping.lastNameClaim.trim() } : {}),
      ...(mapping.rolesClaim ? { rolesClaim: mapping.rolesClaim.trim() } : {}),
      ...(mapping.defaultRole
        ? { defaultRole: this.normalizeInternalRole(mapping.defaultRole) }
        : {}),
      ...(mapping.autoProvisionUsers !== undefined
        ? { autoProvisionUsers: mapping.autoProvisionUsers }
        : {}),
      ...(mapping.syncRoleOnLogin !== undefined
        ? { syncRoleOnLogin: mapping.syncRoleOnLogin }
        : {}),
      ...(mapping.allowedEmailDomain
        ? { allowedEmailDomain: mapping.allowedEmailDomain.trim().toLowerCase() }
        : {}),
    };

    return normalized;
  }

  private normalizeProtocol(protocol: string): SupportedProtocol {
    const normalized = protocol?.trim().toUpperCase();
    if (!SUPPORTED_PROTOCOLS.includes(normalized as SupportedProtocol)) {
      throw new BadRequestException(
        `Unsupported SSO protocol '${protocol}'. Supported values: ${SUPPORTED_PROTOCOLS.join(', ')}`,
      );
    }

    return normalized as SupportedProtocol;
  }

  private normalizeSlug(rawSlug: string): string {
    const slug = rawSlug?.trim().toLowerCase();
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException(
        'SSO provider slug must contain lowercase letters, numbers, and single hyphens only',
      );
    }

    return slug;
  }

  private normalizeScopes(scopes: string[] | undefined): string[] {
    if (!scopes || scopes.length === 0) {
      return ['openid', 'profile', 'email'];
    }

    return scopes
      .map((scope) => scope.trim())
      .filter(Boolean)
      .filter((scope, index, list) => list.indexOf(scope) === index);
  }

  private normalizeOptionalUrl(value: string | undefined): string | null {
    const normalized = this.normalizeOptionalText(value);
    if (!normalized) {
      return null;
    }

    try {
      const parsed = new URL(normalized);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestException('URL must use http or https');
      }
      return parsed.toString();
    } catch {
      throw new BadRequestException(`Invalid URL value '${normalized}'`);
    }
  }

  private normalizeOptionalText(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private resolveRedirectUri(
    redirectUriFromRequest: string | undefined,
    callbackUrl: string | null,
  ): string {
    const candidate = redirectUriFromRequest?.trim() || callbackUrl;
    if (!candidate) {
      throw new BadRequestException('OAuth callback URL is required');
    }

    const parsed = this.normalizeOptionalUrl(candidate);
    if (!parsed) {
      throw new BadRequestException('OAuth callback URL is required');
    }

    return parsed;
  }

  private assertOauthProvider(provider: {
    protocol: string;
    enabled: boolean;
    authorizationUrl: string | null;
    tokenUrl: string | null;
    userInfoUrl: string | null;
    clientId: string | null;
    callbackUrl: string | null;
    scopes: string[];
  }): asserts provider is {
    protocol: 'OAUTH2';
    enabled: true;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    clientId: string;
    callbackUrl: string | null;
    scopes: string[];
  } {
    if (provider.protocol !== 'OAUTH2') {
      throw new BadRequestException('SSO provider is not configured for OAuth 2.0 / OIDC');
    }

    if (!provider.enabled) {
      throw new BadRequestException('SSO provider is disabled');
    }

    if (
      !provider.authorizationUrl ||
      !provider.tokenUrl ||
      !provider.userInfoUrl ||
      !provider.clientId
    ) {
      throw new BadRequestException('OAuth provider configuration is incomplete');
    }
  }

  private async ensureProviderSlugAvailable(tenantId: string, slug: string) {
    const existing = await this.prisma.ssoProvider.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(`SSO provider slug '${slug}' already exists for this tenant`);
    }
  }

  private async findTenantProvider(tenantId: string, providerId: string) {
    const provider = await this.prisma.ssoProvider.findFirst({
      where: {
        id: providerId,
        tenantId,
      },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found for tenant');
    }

    return provider;
  }

  private validateProtocolConfig(
    protocol: SupportedProtocol,
    dto: {
      authorizationUrl?: string | null;
      tokenUrl?: string | null;
      userInfoUrl?: string | null;
      clientId?: string | null;
      entryPoint?: string | null;
      issuer?: string | null;
    },
    isUpdate: boolean,
  ) {
    if (protocol === 'OAUTH2') {
      const missing = [
        ['authorizationUrl', dto.authorizationUrl],
        ['tokenUrl', dto.tokenUrl],
        ['userInfoUrl', dto.userInfoUrl],
        ['clientId', dto.clientId],
      ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

      if (missing.length > 0 && !isUpdate) {
        throw new BadRequestException(
          `OAuth provider requires these fields: ${missing.join(', ')}`,
        );
      }

      return;
    }

    const missing = [
      ['entryPoint', dto.entryPoint],
      ['issuer', dto.issuer],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0 && !isUpdate) {
      throw new BadRequestException(`SAML provider requires these fields: ${missing.join(', ')}`);
    }
  }

  private async safeReadJson(response: Response): Promise<unknown> {
    const body = await response.text();
    if (!body) {
      return {};
    }

    try {
      return JSON.parse(body) as unknown;
    } catch {
      return {
        message: body,
      };
    }
  }

  private cleanupExpiredStates() {
    const now = Date.now();

    for (const [state, context] of this.oauthStateStore.entries()) {
      if (context.expiresAt <= now) {
        this.oauthStateStore.delete(state);
      }
    }
  }
}
