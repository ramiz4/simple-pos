import { BaseRepository, CodeTable } from '@simple-pos/shared/types';

export interface CodeTableRepository extends BaseRepository<CodeTable> {
  findByCodeType(codeType: string): Promise<CodeTable[]>;
  findByCodeTypeAndCode(codeType: string, code: string): Promise<CodeTable | null>;
}
