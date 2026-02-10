import { Module } from '@nestjs/common';
import { ConflictResolutionService } from './conflict-resolution.service';
import { EntitySyncAdapterRegistry } from './entity-sync-adapter.registry';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService, ConflictResolutionService, EntitySyncAdapterRegistry],
  exports: [SyncService],
})
export class SyncModule {}
