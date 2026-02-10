import { SyncEntityMetadata } from './sync-metadata.interface';

export interface CodeTable extends SyncEntityMetadata {
  id: number;
  codeType: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}
