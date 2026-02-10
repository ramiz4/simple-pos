import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ResolveConflictRequest,
  ResolveConflictResponse,
  SyncConflict,
  SyncEntityName,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  SyncStatusResponse,
} from '@simple-pos/shared/types';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class CloudSyncClientService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService,
  ) {}

  async push(payload: SyncPushRequest): Promise<SyncPushResponse> {
    return firstValueFrom(
      this.http.post<SyncPushResponse>(`${this.apiConfig.getBaseUrl()}/sync/push`, payload),
    );
  }

  async pull(params: {
    entities?: SyncEntityName[];
    lastSyncedAt?: string;
    cursor?: string;
    limit?: number;
  }): Promise<SyncPullResponse> {
    let httpParams = new HttpParams();
    if (params.entities && params.entities.length > 0) {
      httpParams = httpParams.set('entities', params.entities.join(','));
    }
    if (params.lastSyncedAt) {
      httpParams = httpParams.set('lastSyncedAt', params.lastSyncedAt);
    }
    if (params.cursor) {
      httpParams = httpParams.set('cursor', params.cursor);
    }
    if (typeof params.limit === 'number') {
      httpParams = httpParams.set('limit', String(params.limit));
    }

    return firstValueFrom(
      this.http.get<SyncPullResponse>(`${this.apiConfig.getBaseUrl()}/sync/pull`, {
        params: httpParams,
      }),
    );
  }

  async status(): Promise<SyncStatusResponse> {
    return firstValueFrom(
      this.http.get<SyncStatusResponse>(`${this.apiConfig.getBaseUrl()}/sync/status`),
    );
  }

  async listConflicts(): Promise<SyncConflict[]> {
    return firstValueFrom(
      this.http.get<SyncConflict[]>(`${this.apiConfig.getBaseUrl()}/sync/conflicts`),
    );
  }

  async resolveConflict(payload: ResolveConflictRequest): Promise<ResolveConflictResponse> {
    return firstValueFrom(
      this.http.post<ResolveConflictResponse>(
        `${this.apiConfig.getBaseUrl()}/sync/resolve-conflict`,
        payload,
      ),
    );
  }
}
