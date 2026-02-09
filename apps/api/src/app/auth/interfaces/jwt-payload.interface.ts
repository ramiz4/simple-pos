export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  accountId: number;
  iat?: number;
  exp?: number;
}
