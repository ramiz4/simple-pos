export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}
