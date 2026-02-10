import { Injectable } from '@nestjs/common';
import { SYNC_ENTITIES, SyncEntityName } from '@simple-pos/shared/types';

@Injectable()
export class EntitySyncAdapterRegistry {
  private readonly entityOrder: SyncEntityName[] = [...SYNC_ENTITIES];
  private readonly priorityMap = new Map<SyncEntityName, number>(
    this.entityOrder.map((entity, idx) => [entity, idx]),
  );

  getEntityOrder(): SyncEntityName[] {
    return [...this.entityOrder];
  }

  sortByDependencyOrder<T extends { entity: SyncEntityName }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const pa = this.priorityMap.get(a.entity) ?? Number.MAX_SAFE_INTEGER;
      const pb = this.priorityMap.get(b.entity) ?? Number.MAX_SAFE_INTEGER;
      return pa - pb;
    });
  }
}
