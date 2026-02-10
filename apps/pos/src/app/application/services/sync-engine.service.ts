import { Injectable, signal } from '@angular/core';
import {
  ConflictResolutionStrategy,
  ResolveConflictResponse,
  SYNC_ENTITIES,
  SyncChangeSet,
  SyncConflict,
  SyncEntityName,
  SyncOperation,
} from '@simple-pos/shared/types';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import { IndexedDBAccountRepository } from '../../infrastructure/repositories/indexeddb-account.repository';
import { IndexedDBCategoryRepository } from '../../infrastructure/repositories/indexeddb-category.repository';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { IndexedDBCodeTranslationRepository } from '../../infrastructure/repositories/indexeddb-code-translation.repository';
import { IndexedDBExtraRepository } from '../../infrastructure/repositories/indexeddb-extra.repository';
import { IndexedDBIngredientRepository } from '../../infrastructure/repositories/indexeddb-ingredient.repository';
import { IndexedDBOrderItemExtraRepository } from '../../infrastructure/repositories/indexeddb-order-item-extra.repository';
import { IndexedDBOrderItemRepository } from '../../infrastructure/repositories/indexeddb-order-item.repository';
import { IndexedDBOrderRepository } from '../../infrastructure/repositories/indexeddb-order.repository';
import { IndexedDBProductExtraRepository } from '../../infrastructure/repositories/indexeddb-product-extra.repository';
import { IndexedDBProductIngredientRepository } from '../../infrastructure/repositories/indexeddb-product-ingredient.repository';
import { IndexedDBProductRepository } from '../../infrastructure/repositories/indexeddb-product.repository';
import { IndexedDBTableRepository } from '../../infrastructure/repositories/indexeddb-table.repository';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { IndexedDBVariantRepository } from '../../infrastructure/repositories/indexeddb-variant.repository';
import { SQLiteAccountRepository } from '../../infrastructure/repositories/sqlite-account.repository';
import { SQLiteCategoryRepository } from '../../infrastructure/repositories/sqlite-category.repository';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../../infrastructure/repositories/sqlite-code-translation.repository';
import { SQLiteExtraRepository } from '../../infrastructure/repositories/sqlite-extra.repository';
import { SQLiteIngredientRepository } from '../../infrastructure/repositories/sqlite-ingredient.repository';
import { SQLiteOrderItemExtraRepository } from '../../infrastructure/repositories/sqlite-order-item-extra.repository';
import { SQLiteOrderItemRepository } from '../../infrastructure/repositories/sqlite-order-item.repository';
import { SQLiteOrderRepository } from '../../infrastructure/repositories/sqlite-order.repository';
import { SQLiteProductExtraRepository } from '../../infrastructure/repositories/sqlite-product-extra.repository';
import { SQLiteProductIngredientRepository } from '../../infrastructure/repositories/sqlite-product-ingredient.repository';
import { SQLiteProductRepository } from '../../infrastructure/repositories/sqlite-product.repository';
import { SQLiteTableRepository } from '../../infrastructure/repositories/sqlite-table.repository';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { SQLiteVariantRepository } from '../../infrastructure/repositories/sqlite-variant.repository';
import { SyncMetadataMigrationService } from '../../infrastructure/services/sync-metadata-migration.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { AuthService } from './auth.service';
import { SyncModeService } from './sync-mode.service';

type EntityRecord = Record<string, unknown> & { id?: number | string };

interface CrudRepository {
  findAll(): Promise<EntityRecord[]>;
  findById?(id: number): Promise<EntityRecord | null>;
  create(entity: Omit<EntityRecord, 'id'>): Promise<EntityRecord> | Promise<void>;
  update?(id: number, entity: Partial<EntityRecord>): Promise<EntityRecord>;
  delete?(id: number): Promise<void>;
}

interface SnapshotState {
  [entity: string]: {
    [key: string]: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SyncEngineService {
  readonly syncing = signal(false);
  readonly lastSyncAt = signal<string | null>(null);
  readonly pendingChanges = signal(0);
  readonly conflicts = signal<SyncConflict[]>([]);
  readonly lastError = signal<string | null>(null);

  private started = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private readonly snapshotStorageKey = 'sync_snapshot_state_v1';
  private readonly cursorStorageKey = 'sync_cursor_state_v1';
  private readonly deviceIdStorageKey = 'sync_device_id';

  constructor(
    private readonly cloudSyncClient: CloudSyncClientService,
    private readonly syncModeService: SyncModeService,
    private readonly authService: AuthService,
    private readonly platformService: PlatformService,
    private readonly syncMetadataMigrationService: SyncMetadataMigrationService,
    private readonly sqliteAccountRepo: SQLiteAccountRepository,
    private readonly indexedDbAccountRepo: IndexedDBAccountRepository,
    private readonly sqliteUserRepo: SQLiteUserRepository,
    private readonly indexedDbUserRepo: IndexedDBUserRepository,
    private readonly sqliteCodeTableRepo: SQLiteCodeTableRepository,
    private readonly indexedDbCodeTableRepo: IndexedDBCodeTableRepository,
    private readonly sqliteCodeTranslationRepo: SQLiteCodeTranslationRepository,
    private readonly indexedDbCodeTranslationRepo: IndexedDBCodeTranslationRepository,
    private readonly sqliteCategoryRepo: SQLiteCategoryRepository,
    private readonly indexedDbCategoryRepo: IndexedDBCategoryRepository,
    private readonly sqliteExtraRepo: SQLiteExtraRepository,
    private readonly indexedDbExtraRepo: IndexedDBExtraRepository,
    private readonly sqliteIngredientRepo: SQLiteIngredientRepository,
    private readonly indexedDbIngredientRepo: IndexedDBIngredientRepository,
    private readonly sqliteTableRepo: SQLiteTableRepository,
    private readonly indexedDbTableRepo: IndexedDBTableRepository,
    private readonly sqliteProductRepo: SQLiteProductRepository,
    private readonly indexedDbProductRepo: IndexedDBProductRepository,
    private readonly sqliteVariantRepo: SQLiteVariantRepository,
    private readonly indexedDbVariantRepo: IndexedDBVariantRepository,
    private readonly sqliteProductExtraRepo: SQLiteProductExtraRepository,
    private readonly indexedDbProductExtraRepo: IndexedDBProductExtraRepository,
    private readonly sqliteProductIngredientRepo: SQLiteProductIngredientRepository,
    private readonly indexedDbProductIngredientRepo: IndexedDBProductIngredientRepository,
    private readonly sqliteOrderRepo: SQLiteOrderRepository,
    private readonly indexedDbOrderRepo: IndexedDBOrderRepository,
    private readonly sqliteOrderItemRepo: SQLiteOrderItemRepository,
    private readonly indexedDbOrderItemRepo: IndexedDBOrderItemRepository,
    private readonly sqliteOrderItemExtraRepo: SQLiteOrderItemExtraRepository,
    private readonly indexedDbOrderItemExtraRepo: IndexedDBOrderItemExtraRepository,
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;

    await this.syncMetadataMigrationService.ensure();
    await this.syncModeService.start();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }

    this.syncTimer = setInterval(
      () => {
        void this.syncNow();
      },
      5 * 60 * 1000,
    );

    await this.syncNow();
  }

  async syncNow(): Promise<void> {
    if (this.syncing()) {
      return;
    }

    if (this.syncModeService.mode() === 'local' || !this.authService.getCloudTenantId()) {
      return;
    }

    this.syncing.set(true);
    this.lastError.set(null);

    try {
      const localChanges = await this.buildLocalChanges();
      this.pendingChanges.set(localChanges.length);

      if (localChanges.length > 0) {
        const tenantId = this.requireTenantId();
        const pushResult = await this.cloudSyncClient.push({
          tenantId,
          deviceId: this.getDeviceId(),
          lastSyncedAt: this.getCursor(),
          changes: localChanges,
        });

        this.conflicts.set(pushResult.conflicts);
      }

      await this.pullRemoteChanges();
      await this.loadConflicts();
      this.lastSyncAt.set(new Date().toISOString());
    } catch (error) {
      this.lastError.set(error instanceof Error ? error.message : 'Failed to sync');
    } finally {
      this.syncing.set(false);
    }
  }

  async loadConflicts(): Promise<void> {
    try {
      if (this.syncModeService.mode() === 'local' || !this.authService.hasCloudSession()) {
        this.conflicts.set([]);
        return;
      }

      const conflicts = await this.cloudSyncClient.listConflicts();
      this.conflicts.set(conflicts);
    } catch {
      // Keep the previous value if cloud is not reachable.
    }
  }

  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    mergedData?: Record<string, unknown>,
  ): Promise<ResolveConflictResponse> {
    const result = await this.cloudSyncClient.resolveConflict({
      conflictId,
      strategy,
      mergedData,
    });

    await this.loadConflicts();
    await this.syncNow();

    return result;
  }

  private async pullRemoteChanges(): Promise<void> {
    const response = await this.cloudSyncClient.pull({
      entities: [...SYNC_ENTITIES],
      cursor: this.getCursor(),
      limit: 500,
    });

    for (const change of response.changes) {
      await this.applyRemoteChange(change.entity, change.localId, change.data);
    }

    for (const deletion of response.deletions) {
      await this.applyRemoteDelete(deletion.entity, deletion.cloudId);
    }

    if (response.nextCursor) {
      this.setCursor(response.nextCursor);
    } else {
      this.setCursor(response.syncedAt);
    }
  }

  private async buildLocalChanges(): Promise<SyncChangeSet[]> {
    const snapshotBefore = this.readSnapshot();
    const snapshotAfter: SnapshotState = {};
    const changes: SyncChangeSet[] = [];

    for (const entity of SYNC_ENTITIES) {
      const records = await this.getAllRecords(entity);
      const beforeEntity = snapshotBefore[entity] ?? {};
      const afterEntity: Record<string, string> = {};

      for (const record of records) {
        const key = this.getRecordKey(entity, record);
        if (!key) {
          continue;
        }

        const serialized = JSON.stringify(record);
        afterEntity[key] = serialized;

        if (!(key in beforeEntity)) {
          changes.push(this.toChange(entity, 'CREATE', record, key));
          continue;
        }

        if (beforeEntity[key] !== serialized) {
          changes.push(this.toChange(entity, 'UPDATE', record, key));
        }
      }

      for (const [key, previousSerialized] of Object.entries(beforeEntity)) {
        if (key in afterEntity) {
          continue;
        }

        const previous = this.safeParse(previousSerialized);
        const previousRecord = this.ensureRecord(previous, key);
        changes.push(this.toChange(entity, 'DELETE', previousRecord, key));
      }

      snapshotAfter[entity] = afterEntity;
    }

    this.writeSnapshot(snapshotAfter);

    return changes;
  }

  private toChange(
    entity: SyncEntityName,
    operation: SyncOperation,
    record: EntityRecord,
    key: string,
  ): SyncChangeSet {
    const localId =
      typeof record.id === 'number' || typeof record.id === 'string' ? record.id : key;
    const version = typeof record['version'] === 'number' ? record['version'] : 1;
    const cloudId = typeof record['cloudId'] === 'string' ? record['cloudId'] : undefined;
    const lastModified =
      typeof record['lastModifiedAt'] === 'string'
        ? record['lastModifiedAt']
        : new Date().toISOString();

    return {
      entity,
      operation,
      localId,
      cloudId,
      data: {
        ...record,
        localId,
        version,
        isDirty: true,
        isDeleted: operation === 'DELETE',
        lastModifiedAt: lastModified,
      },
      version,
      timestamp: lastModified,
    };
  }

  private async getAllRecords(entity: SyncEntityName): Promise<EntityRecord[]> {
    const repo = this.getRepository(entity);
    return repo.findAll();
  }

  private getRepository(entity: SyncEntityName): CrudRepository {
    const isTauri = this.platformService.isTauri();

    switch (entity) {
      case 'account':
        return isTauri ? this.sqliteAccountRepo : this.indexedDbAccountRepo;
      case 'user':
        return isTauri ? this.sqliteUserRepo : this.indexedDbUserRepo;
      case 'code_table':
        return isTauri ? this.sqliteCodeTableRepo : this.indexedDbCodeTableRepo;
      case 'code_translation':
        return isTauri ? this.sqliteCodeTranslationRepo : this.indexedDbCodeTranslationRepo;
      case 'category':
        return isTauri ? this.sqliteCategoryRepo : this.indexedDbCategoryRepo;
      case 'extra':
        return isTauri ? this.sqliteExtraRepo : this.indexedDbExtraRepo;
      case 'ingredient':
        return isTauri ? this.sqliteIngredientRepo : this.indexedDbIngredientRepo;
      case 'table':
        return isTauri ? this.sqliteTableRepo : this.indexedDbTableRepo;
      case 'product':
        return isTauri ? this.sqliteProductRepo : this.indexedDbProductRepo;
      case 'variant':
        return isTauri ? this.sqliteVariantRepo : this.indexedDbVariantRepo;
      case 'product_extra':
        return isTauri ? this.sqliteProductExtraRepo : this.indexedDbProductExtraRepo;
      case 'product_ingredient':
        return isTauri ? this.sqliteProductIngredientRepo : this.indexedDbProductIngredientRepo;
      case 'order':
        return isTauri ? this.sqliteOrderRepo : this.indexedDbOrderRepo;
      case 'order_item':
        return isTauri ? this.sqliteOrderItemRepo : this.indexedDbOrderItemRepo;
      case 'order_item_extra':
        return isTauri ? this.sqliteOrderItemExtraRepo : this.indexedDbOrderItemExtraRepo;
      default:
        throw new Error(`Unknown sync entity: ${entity}`);
    }
  }

  private getRecordKey(entity: SyncEntityName, record: EntityRecord): string | null {
    if (entity === 'order_item_extra') {
      const orderId = record['orderId'];
      const orderItemId = record['orderItemId'];
      const extraId = record['extraId'];
      if (
        (typeof orderId === 'number' || typeof orderId === 'string') &&
        (typeof orderItemId === 'number' || typeof orderItemId === 'string') &&
        (typeof extraId === 'number' || typeof extraId === 'string')
      ) {
        return `${orderId}:${orderItemId}:${extraId}`;
      }
      return null;
    }

    if (typeof record.id === 'number' || typeof record.id === 'string') {
      return String(record.id);
    }

    return null;
  }

  private async applyRemoteChange(
    entity: SyncEntityName,
    localId: string | number | undefined,
    data: Record<string, unknown>,
  ): Promise<void> {
    const repo = this.getRepository(entity);

    if (entity === 'order_item_extra') {
      await this.applyOrderItemExtraChange(data);
      return;
    }

    if (!repo.create || !repo.update) {
      return;
    }

    const numericId = this.asNumber(localId ?? data['id']);
    const payload = this.stripId(data);

    if (numericId !== null && repo.findById) {
      const existing = await repo.findById(numericId);
      if (existing) {
        await repo.update(numericId, payload);
        return;
      }
    }

    await repo.create(payload);
  }

  private async applyOrderItemExtraChange(data: Record<string, unknown>): Promise<void> {
    const repo = this.getRepository('order_item_extra');
    const all = await repo.findAll();

    const orderId = this.asNumber(data['orderId']);
    const orderItemId = this.asNumber(data['orderItemId']);
    const extraId = this.asNumber(data['extraId']);

    if (orderId === null || orderItemId === null || extraId === null) {
      return;
    }

    const exists = all.some(
      (item) =>
        this.asNumber(item['orderId']) === orderId &&
        this.asNumber(item['orderItemId']) === orderItemId &&
        this.asNumber(item['extraId']) === extraId,
    );

    if (!exists) {
      await repo.create({
        orderId,
        orderItemId,
        extraId,
      });
    }
  }

  private async applyRemoteDelete(entity: SyncEntityName, cloudId: string): Promise<void> {
    const repo = this.getRepository(entity);
    const records = await repo.findAll();
    const matched = records.filter((record) => record['cloudId'] === cloudId);

    if (entity === 'order_item_extra') {
      for (const match of matched) {
        const orderItemId = this.asNumber(match['orderItemId']);
        if (
          orderItemId !== null &&
          'deleteByOrderItemId' in repo &&
          typeof (repo as { deleteByOrderItemId: (id: number) => Promise<void> })
            .deleteByOrderItemId === 'function'
        ) {
          await (
            repo as { deleteByOrderItemId: (id: number) => Promise<void> }
          ).deleteByOrderItemId(orderItemId);
        }
      }
      return;
    }

    if (!repo.delete) {
      return;
    }

    for (const match of matched) {
      const id = this.asNumber(match.id);
      if (id !== null) {
        await repo.delete(id);
      }
    }
  }

  private ensureRecord(value: unknown, fallbackId: string): EntityRecord {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as EntityRecord;
    }
    return { id: fallbackId };
  }

  private safeParse(input: string): unknown {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }

  private stripId(record: Record<string, unknown>): Omit<EntityRecord, 'id'> {
    const clone: Record<string, unknown> = { ...record };
    delete clone['id'];
    return clone;
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private requireTenantId(): string {
    const tenantId = this.authService.getCloudTenantId();
    if (!tenantId) {
      throw new Error('No cloud tenant context available');
    }
    return tenantId;
  }

  private getDeviceId(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'server-device';
    }

    const existing = localStorage.getItem(this.deviceIdStorageKey);
    if (existing) {
      return existing;
    }

    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(this.deviceIdStorageKey, next);
    return next;
  }

  private readSnapshot(): SnapshotState {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {};
    }

    const stored = localStorage.getItem(this.snapshotStorageKey);
    if (!stored) {
      return {};
    }

    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as SnapshotState;
      }
      return {};
    } catch {
      return {};
    }
  }

  private writeSnapshot(snapshot: SnapshotState): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    localStorage.setItem(this.snapshotStorageKey, JSON.stringify(snapshot));
  }

  private getCursor(): string | undefined {
    if (typeof window === 'undefined' || !window.localStorage) {
      return undefined;
    }

    return localStorage.getItem(this.cursorStorageKey) ?? undefined;
  }

  private setCursor(cursor: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    localStorage.setItem(this.cursorStorageKey, cursor);
  }

  private handleOnline = () => {
    void this.syncNow();
  };
}
