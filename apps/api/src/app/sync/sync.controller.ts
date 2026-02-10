import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ConflictResolutionStrategy,
  ResolveConflictRequest,
  ResolveConflictResponse,
  SyncEntityName,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from '@simple-pos/shared/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenants/tenant.decorator';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @UseGuards(JwtAuthGuard)
  @Post('push')
  async push(
    @TenantId() tenantId: string,
    @Body() body: SyncPushRequest,
  ): Promise<SyncPushResponse> {
    this.assertTenantConsistency(tenantId, body.tenantId);
    return this.syncService.push(tenantId, body.deviceId, body.changes ?? []);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pull')
  async pull(
    @TenantId() tenantId: string,
    @Query('entities') entities?: string,
    @Query('lastSyncedAt') lastSyncedAt?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<SyncPullResponse> {
    const parsedEntities = entities
      ? entities
          .split(',')
          .map((item) => item.trim())
          .filter((item): item is SyncEntityName => item.length > 0)
      : undefined;

    const parsedLimit = limit ? Number(limit) : undefined;

    return this.syncService.pull(tenantId, parsedEntities, lastSyncedAt, cursor, parsedLimit);
  }

  @Get('status')
  status() {
    return {
      online: true,
      mode: 'cloud' as const,
      serverTime: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('conflicts')
  async conflicts(@TenantId() tenantId: string) {
    return this.syncService.listOpenConflicts(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resolve-conflict')
  async resolveConflict(
    @TenantId() tenantId: string,
    @Body() body: ResolveConflictRequest,
  ): Promise<ResolveConflictResponse> {
    return this.syncService.resolveConflict(
      tenantId,
      body.conflictId,
      body.strategy as ConflictResolutionStrategy,
      body.mergedData,
    );
  }

  private assertTenantConsistency(requestTenantId: string, bodyTenantId: string): void {
    if (requestTenantId !== bodyTenantId) {
      throw new BadRequestException('Tenant ID mismatch between request context and body');
    }
  }
}
