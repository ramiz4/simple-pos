import { SyncEntityMetadata } from './sync-metadata.interface';

export interface CodeTranslation extends SyncEntityMetadata {
  id: number;
  codeTableId: number;
  language: string;
  label: string;
}
