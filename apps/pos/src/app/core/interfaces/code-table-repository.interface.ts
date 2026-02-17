import { BaseRepository, CodeTable } from '@simple-pos/shared/types';

export interface CodeTableRepository extends BaseRepository<CodeTable> {
  findByCodeType(codeType: string, includeInactive?: boolean): Promise<CodeTable[]>;
  findByCodeTypeAndCode(
    codeType: string,
    code: string,
    includeInactive?: boolean,
  ): Promise<CodeTable | null>;
}
