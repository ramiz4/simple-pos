import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from './api-config.service';

export interface CloudAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface CloudAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: CloudAuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class CloudAuthClientService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService,
  ) {}

  async login(email: string, password: string): Promise<CloudAuthResponse> {
    return firstValueFrom(
      this.http.post<CloudAuthResponse>(`${this.apiConfig.getBaseUrl()}/auth/login`, {
        email,
        password,
      }),
    );
  }

  async refresh(refreshToken: string): Promise<CloudAuthResponse> {
    return firstValueFrom(
      this.http.post<CloudAuthResponse>(`${this.apiConfig.getBaseUrl()}/auth/refresh`, {
        refreshToken,
      }),
    );
  }

  async me(accessToken: string): Promise<CloudAuthUser> {
    return firstValueFrom(
      this.http.get<CloudAuthUser>(`${this.apiConfig.getBaseUrl()}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
  }
}
