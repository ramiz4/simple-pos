import { CodeTranslation } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface CodeTranslationRepository extends BaseRepository<CodeTranslation> {
  findByCodeTableIdAndLanguage(
    codeTableId: number,
    language: string,
  ): Promise<CodeTranslation | null>;
}
