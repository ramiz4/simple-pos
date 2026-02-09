export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  accountId: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}
