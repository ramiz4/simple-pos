import { CodeTable } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface CodeTableRepository extends BaseRepository<CodeTable> {
  findByCodeType(codeType: string): Promise<CodeTable[]>;
  findByCodeTypeAndCode(codeType: string, code: string): Promise<CodeTable | null>;
}
