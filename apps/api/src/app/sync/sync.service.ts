import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ConflictResolutionStrategy,
  ResolveConflictResponse,
  SYNC_ENTITIES,
  SyncChangeSet,
  SyncConflict,
  SyncEntityName,
  SyncPullResponse,
  SyncPushAccepted,
  SyncPushRejected,
  SyncPushResponse,
} from '@simple-pos/shared/types';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConflictResolutionService } from './conflict-resolution.service';
import { EntitySyncAdapterRegistry } from './entity-sync-adapter.registry';

const DEFAULT_STRATEGY: Record<SyncEntityName, ConflictResolutionStrategy> = {
  account: 'MANUAL',
  user: 'MANUAL',
  code_table: 'SERVER_WINS',
  code_translation: 'SERVER_WINS',
  category: 'SERVER_WINS',
  extra: 'SERVER_WINS',
  ingredient: 'SERVER_WINS',
  table: 'SERVER_WINS',
  product: 'SERVER_WINS',
  variant: 'SERVER_WINS',
  product_extra: 'SERVER_WINS',
  product_ingredient: 'SERVER_WINS',
  order: 'LAST_WRITE_WINS',
  order_item: 'LAST_WRITE_WINS',
  order_item_extra: 'LAST_WRITE_WINS',
};

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflictResolutionService: ConflictResolutionService,
    private readonly entityRegistry: EntitySyncAdapterRegistry,
  ) {}

  async push(
    tenantId: string,
    deviceId: string,
    changes: SyncChangeSet[],
  ): Promise<SyncPushResponse> {
    const accepted: SyncPushAccepted[] = [];
    const rejected: SyncPushRejected[] = [];
    const conflicts: SyncConflict[] = [];

    const sortedChanges = this.entityRegistry.sortByDependencyOrder(changes);

    await this.prisma.withRls(tenantId, async (tx) => {
      for (const change of sortedChanges) {
        if (!SYNC_ENTITIES.includes(change.entity)) {
          rejected.push({
            entity: change.entity,
            localId: change.localId,
            cloudId: change.cloudId,
            reason: 'Unsupported entity',
          });
          continue;
        }

        const localId = change.localId !== undefined ? String(change.localId) : undefined;
        const cloudId = change.cloudId ?? randomUUID();

        const existing = await tx.syncDocument.findFirst({
          where: {
            tenantId,
            entity: change.entity,
            OR: [{ cloudId }, ...(localId ? [{ localId }] : [])],
          },
        });

        const timestamp = this.parseTimestamp(change.timestamp);

        if (!existing) {
          const effectiveVersion = Math.max(1, change.version);
          await tx.syncDocument.create({
            data: {
              tenantId,
              entity: change.entity,
              cloudId,
              localId,
              deviceId,
              data: this.normalizeData(change.data, cloudId, effectiveVersion),
              version: effectiveVersion,
              isDeleted: change.operation === 'DELETE',
              syncedAt: new Date(),
              lastModifiedAt: timestamp,
            },
          });

          accepted.push({
            entity: change.entity,
            localId: change.localId,
            cloudId,
            syncedAt: new Date().toISOString(),
          });
          continue;
        }

        if (change.version < existing.version) {
          const strategy = DEFAULT_STRATEGY[change.entity] ?? 'MANUAL';
          const created = await tx.syncConflict.create({
            data: {
              tenantId,
              entity: change.entity,
              cloudId: existing.cloudId,
              localId,
              strategy,
              serverVersion: existing.version,
              clientVersion: change.version,
              serverData: this.toInputJsonValue(existing.data),
              clientData: this.normalizeData(change.data, existing.cloudId, change.version),
            },
          });

          conflicts.push({
            id: created.id,
            entity: change.entity,
            cloudId: created.cloudId,
            localId: change.localId,
            strategy,
            serverVersion: created.serverVersion,
            clientVersion: created.clientVersion,
            serverData: this.asRecord(created.serverData),
            clientData: this.asRecord(created.clientData),
            resolved: created.resolved,
          });
          continue;
        }

        const nextVersion = Math.max(existing.version, change.version) + 1;
        const mergedData = this.normalizeData(change.data, existing.cloudId, nextVersion);
        await tx.syncDocument.update({
          where: { id: existing.id },
          data: {
            localId,
            deviceId,
            data: mergedData,
            version: nextVersion,
            isDeleted: change.operation === 'DELETE',
            syncedAt: new Date(),
            lastModifiedAt: timestamp,
          },
        });

        accepted.push({
          entity: change.entity,
          localId: change.localId,
          cloudId: existing.cloudId,
          syncedAt: new Date().toISOString(),
        });
      }
    });

    return {
      success: conflicts.length === 0,
      conflicts,
      accepted,
      rejected,
      syncedAt: new Date().toISOString(),
    };
  }

  async pull(
    tenantId: string,
    entities: SyncEntityName[] | undefined,
    lastSyncedAt: string | undefined,
    cursor: string | undefined,
    limit: number | undefined,
  ): Promise<SyncPullResponse> {
    const safeLimit = Math.min(Math.max(limit ?? 500, 1), 1000);
    const effectiveEntities = entities && entities.length > 0 ? entities : [...SYNC_ENTITIES];

    // Parse composite cursor (updatedAt:id) or fallback to lastSyncedAt
    let cursorUpdatedAt: Date | undefined;
    let cursorId: number | undefined;

    if (cursor) {
      const parts = cursor.split(':');
      if (parts.length === 2) {
        cursorUpdatedAt = this.parseTimestamp(parts[0]);
        cursorId = parseInt(parts[1], 10);
      } else {
        // Fallback for old single-value cursor
        cursorUpdatedAt = this.parseTimestamp(cursor);
      }
    } else if (lastSyncedAt) {
      cursorUpdatedAt = this.parseTimestamp(lastSyncedAt);
    }

    const docs = await this.prisma.withRls(tenantId, (tx) =>
      tx.syncDocument.findMany({
        where: {
          tenantId,
          entity: { in: effectiveEntities },
          ...(cursorUpdatedAt
            ? {
                OR: [
                  { updatedAt: { gt: cursorUpdatedAt } },
                  ...(cursorId ? [{ updatedAt: cursorUpdatedAt, id: { gt: cursorId } }] : []),
                ],
              }
            : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: safeLimit + 1,
      }),
    );

    const hasMore = docs.length > safeLimit;
    const page = hasMore ? docs.slice(0, safeLimit) : docs;

    const changes: SyncChangeSet[] = [];
    const deletions: Array<{ entity: SyncEntityName; cloudId: string; deletedAt?: string }> = [];

    for (const doc of page) {
      const entity = doc.entity as SyncEntityName;
      if (doc.isDeleted) {
        deletions.push({
          entity,
          cloudId: doc.cloudId,
          deletedAt: doc.updatedAt.toISOString(),
        });
      } else {
        changes.push({
          entity,
          operation: 'UPDATE',
          localId: doc.localId ?? undefined,
          cloudId: doc.cloudId,
          data: this.asRecord(doc.data),
          version: doc.version,
          timestamp: doc.updatedAt.toISOString(),
        });
      }
    }

    // Return composite cursor (updatedAt:id)
    const nextCursor =
      hasMore && page.length > 0
        ? `${page[page.length - 1].updatedAt.toISOString()}:${page[page.length - 1].id}`
        : undefined;

    return {
      changes,
      deletions,
      syncedAt: new Date().toISOString(),
      hasMore,
      nextCursor,
    };
  }

  async listOpenConflicts(tenantId: string): Promise<SyncConflict[]> {
    const rows = await this.prisma.withRls(tenantId, (tx) =>
      tx.syncConflict.findMany({
        where: { tenantId, resolved: false },
        orderBy: { createdAt: 'asc' },
      }),
    );

    return rows.map((row) => ({
      id: row.id,
      entity: row.entity as SyncEntityName,
      cloudId: row.cloudId,
      localId: row.localId ?? undefined,
      strategy: row.strategy as ConflictResolutionStrategy,
      serverVersion: row.serverVersion,
      clientVersion: row.clientVersion,
      serverData: this.asRecord(row.serverData),
      clientData: this.asRecord(row.clientData),
      resolved: row.resolved,
      serverTimestamp: this.readTimestamp(row.serverData),
      clientTimestamp: this.readTimestamp(row.clientData),
    }));
  }

  async resolveConflict(
    tenantId: string,
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    mergedData?: Record<string, unknown>,
  ): Promise<ResolveConflictResponse> {
    await this.conflictResolutionService.resolve(tenantId, conflictId, strategy, mergedData);

    return {
      success: true,
      conflictId,
      syncedAt: new Date().toISOString(),
    };
  }

  private parseTimestamp(input: string): Date {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid timestamp: ${input}`);
    }
    return date;
  }

  private normalizeData(
    data: Record<string, unknown>,
    cloudId: string,
    version: number,
  ): Prisma.InputJsonValue {
    return {
      ...data,
      cloudId,
      version,
      isDirty: false,
      syncedAt: new Date().toISOString(),
      lastModifiedAt:
        typeof data['lastModifiedAt'] === 'string'
          ? data['lastModifiedAt']
          : new Date().toISOString(),
    } as Prisma.InputJsonObject;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private readTimestamp(value: unknown): string | undefined {
    const record = this.asRecord(value);
    const ts = record['lastModifiedAt'];
    return typeof ts === 'string' ? ts : undefined;
  }

  private toInputJsonValue(value: Prisma.JsonValue | null): Prisma.InputJsonValue {
    if (value === null) {
      return {} as Prisma.InputJsonObject;
    }

    return value as Prisma.InputJsonValue;
  }
}
