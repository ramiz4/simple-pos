import { Inject, Injectable, signal } from '@angular/core';
import {
  Account,
  Category,
  CodeTable,
  CodeTranslation,
  ConflictResolutionStrategy,
  Extra,
  Ingredient,
  Order,
  OrderItem,
  OrderItemExtra,
  Product,
  ProductExtra,
  ProductIngredient,
  ResolveConflictResponse,
  SYNC_ENTITIES,
  SyncChangeSet,
  SyncConflict,
  SyncEntityName,
  SyncOperation,
  Table,
  User,
  Variant,
} from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import { SyncMetadataMigrationService } from '../../infrastructure/services/sync-metadata-migration.service';
import {
  ACCOUNT_REPOSITORY,
  CATEGORY_REPOSITORY,
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
  EXTRA_REPOSITORY,
  INGREDIENT_REPOSITORY,
  ORDER_ITEM_EXTRA_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_EXTRA_REPOSITORY,
  PRODUCT_INGREDIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
  TABLE_REPOSITORY,
  USER_REPOSITORY,
  VARIANT_REPOSITORY,
} from '../../infrastructure/tokens/repository.tokens';
import { AuthService } from './auth.service';
import { SyncModeService } from './sync-mode.service';

type EntityRecord = Record<string, unknown> & { id?: number | string };

interface CrudRepository {
  findAll(): Promise<unknown[]>;
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
  private _lastError = signal<string | null>(null);
  readonly lastError = this._lastError.asReadonly();

  private started = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private readonly snapshotStorageKey = 'sync_snapshot_state_v1';
  private readonly cursorStorageKey = 'sync_cursor_state_v1';
  private readonly deviceIdStorageKey = 'sync_device_id';

  private readonly repositoryMap: Map<SyncEntityName, CrudRepository>;

  constructor(
    private readonly cloudSyncClient: CloudSyncClientService,
    private readonly syncModeService: SyncModeService,
    private readonly authService: AuthService,
    private readonly syncMetadataMigrationService: SyncMetadataMigrationService,
    @Inject(ACCOUNT_REPOSITORY) accountRepo: BaseRepository<Account>,
    @Inject(USER_REPOSITORY) userRepo: BaseRepository<User>,
    @Inject(CODE_TABLE_REPOSITORY) codeTableRepo: BaseRepository<CodeTable>,
    @Inject(CODE_TRANSLATION_REPOSITORY) codeTranslationRepo: BaseRepository<CodeTranslation>,
    @Inject(CATEGORY_REPOSITORY) categoryRepo: BaseRepository<Category>,
    @Inject(EXTRA_REPOSITORY) extraRepo: BaseRepository<Extra>,
    @Inject(INGREDIENT_REPOSITORY) ingredientRepo: BaseRepository<Ingredient>,
    @Inject(TABLE_REPOSITORY) tableRepo: BaseRepository<Table>,
    @Inject(PRODUCT_REPOSITORY) productRepo: BaseRepository<Product>,
    @Inject(VARIANT_REPOSITORY) variantRepo: BaseRepository<Variant>,
    @Inject(PRODUCT_EXTRA_REPOSITORY) productExtraRepo: BaseRepository<ProductExtra>,
    @Inject(PRODUCT_INGREDIENT_REPOSITORY) productIngredientRepo: BaseRepository<ProductIngredient>,
    @Inject(ORDER_REPOSITORY) orderRepo: BaseRepository<Order>,
    @Inject(ORDER_ITEM_REPOSITORY) orderItemRepo: BaseRepository<OrderItem>,
    @Inject(ORDER_ITEM_EXTRA_REPOSITORY) orderItemExtraRepo: BaseRepository<OrderItemExtra>,
  ) {
    this.repositoryMap = new Map<SyncEntityName, CrudRepository>([
      ['account', accountRepo],
      ['user', userRepo],
      ['code_table', codeTableRepo],
      ['code_translation', codeTranslationRepo],
      ['category', categoryRepo],
      ['extra', extraRepo],
      ['ingredient', ingredientRepo],
      ['table', tableRepo],
      ['product', productRepo],
      ['variant', variantRepo],
      ['product_extra', productExtraRepo],
      ['product_ingredient', productIngredientRepo],
      ['order', orderRepo],
      ['order_item', orderItemRepo],
      ['order_item_extra', orderItemExtraRepo],
    ]);
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;

    await this.syncMetadataMigrationService.ensure();
    // SyncModeService.start() is already called via APP_INITIALIZER;
    // its internal `started` guard prevents duplicate work.
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

    // Only attempt initial sync when in cloud/hybrid mode.
    // In local mode (no API server) this avoids wasted work at startup.
    if (this.syncModeService.mode() !== 'local') {
      await this.syncNow();
    }
  }

  async syncNow(): Promise<void> {
    if (this.syncing()) {
      return;
    }

    if (this.syncModeService.mode() === 'local' || !this.authService.getCloudTenantId()) {
      return;
    }

    this.syncing.set(true);
    this._lastError.set(null);

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

      // Clear pending changes after successful sync
      this.pendingChanges.set(0);
    } catch (error) {
      this._lastError.set(error instanceof Error ? error.message : 'Failed to sync');
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
    const records = await repo.findAll();
    return records.map((record, index) => this.ensureRecord(record, `${entity}:${index}`));
  }

  private getRepository(entity: SyncEntityName): CrudRepository {
    const repo = this.repositoryMap.get(entity);
    if (!repo) {
      throw new Error(`Unknown sync entity: ${entity}`);
    }
    return repo;
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
    const mutableRepo = repo as Partial<{
      findById: (id: number) => Promise<unknown | null>;
      create: (entity: Record<string, unknown>) => Promise<unknown> | Promise<void>;
      update: (id: number, entity: Record<string, unknown>) => Promise<unknown>;
    }>;

    if (entity === 'order_item_extra') {
      await this.applyOrderItemExtraChange(data);
      return;
    }

    if (!mutableRepo.create || !mutableRepo.update) {
      return;
    }

    const numericId = this.asNumber(localId ?? data['id']);

    // Preserve the ID from the incoming data to maintain relationships
    // Only strip metadata fields, not the primary key
    const {
      version: _version,
      isDirty: _isDirty,
      isDeleted: _isDeleted,
      syncedAt: _syncedAt,
      lastModifiedAt: _lastModifiedAt,
      deletedAt: _deletedAt,
      tenantId: _tenantId,
      ...payload
    } = data;

    if (numericId !== null && mutableRepo.findById) {
      const existing = await mutableRepo.findById(numericId);
      if (existing) {
        // Update existing record, preserving its ID
        const { id: _, ...updatePayload } = payload;
        await mutableRepo.update(numericId, updatePayload);
        return;
      }
    }

    // Create new record, preserving the ID from remote to maintain relationships
    await mutableRepo.create(payload);
  }

  private async applyOrderItemExtraChange(data: Record<string, unknown>): Promise<void> {
    const repo = this.getRepository('order_item_extra');
    const mutableRepo = repo as Partial<{
      create: (entity: { orderId: number; orderItemId: number; extraId: number }) => Promise<void>;
    }>;
    const all = (await repo.findAll()).map((record, index) =>
      this.ensureRecord(record, `order_item_extra:${index}`),
    );

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

    if (!exists && mutableRepo.create) {
      await mutableRepo.create({
        orderId,
        orderItemId,
        extraId,
      });
    }
  }

  private async applyRemoteDelete(entity: SyncEntityName, cloudId: string): Promise<void> {
    const repo = this.getRepository(entity);
    const mutableRepo = repo as Partial<{
      delete: (id: number) => Promise<void>;
      deleteByOrderItemId: (id: number) => Promise<void>;
    }>;
    const records = (await repo.findAll()).map((record, index) =>
      this.ensureRecord(record, `${entity}:${index}`),
    );
    const matched = records.filter((record) => record['cloudId'] === cloudId);

    if (entity === 'order_item_extra') {
      for (const match of matched) {
        const orderItemId = this.asNumber(match['orderItemId']);
        if (orderItemId !== null && typeof mutableRepo.deleteByOrderItemId === 'function') {
          await mutableRepo.deleteByOrderItemId(orderItemId);
        }
      }
      return;
    }

    if (!mutableRepo.delete) {
      return;
    }

    for (const match of matched) {
      const id = this.asNumber(match.id);
      if (id !== null) {
        await mutableRepo.delete(id);
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

  private stripId(record: Record<string, unknown>): Record<string, unknown> {
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

    try {
      localStorage.setItem(this.snapshotStorageKey, JSON.stringify(snapshot));
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded when writing snapshot. Clearing old snapshot.');
        // Clear the old snapshot to free up space
        localStorage.removeItem(this.snapshotStorageKey);
      } else {
        console.error('Failed to write snapshot to localStorage:', error);
      }
    }
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
