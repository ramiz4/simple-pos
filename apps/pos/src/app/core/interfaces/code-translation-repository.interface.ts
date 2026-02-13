import { BaseRepository, CodeTranslation } from '@simple-pos/shared/types';

export interface CodeTranslationRepository extends BaseRepository<CodeTranslation> {
  findByCodeTableIdAndLanguage(
    codeTableId: number,
    language: string,
  ): Promise<CodeTranslation | null>;
}
