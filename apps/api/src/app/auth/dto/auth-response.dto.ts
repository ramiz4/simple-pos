export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface AuthTenantResponse {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  trialEndsAt?: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
  tenant?: AuthTenantResponse;
  permissions?: string[];
  apiKey?: ApiKeyResponse;
}
