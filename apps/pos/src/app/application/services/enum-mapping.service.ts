import { Inject, Injectable } from '@angular/core';
import { CodeTable } from '@simple-pos/shared/types';
import { CodeTableRepository } from '../../core/interfaces/code-table-repository.interface';
import { CodeTranslationRepository } from '../../core/interfaces/code-translation-repository.interface';
import {
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
} from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class EnumMappingService {
  private codeTableCache: Map<string, CodeTable[]> = new Map();
  private reverseCache: Map<number, { codeType: string; code: string }> = new Map();
  private codeTableRepo: CodeTableRepository;
  private codeTranslationRepo: CodeTranslationRepository;

  constructor(
    @Inject(CODE_TABLE_REPOSITORY) codeTableRepo: CodeTableRepository,
    @Inject(CODE_TRANSLATION_REPOSITORY) codeTranslationRepo: CodeTranslationRepository,
  ) {
    this.codeTableRepo = codeTableRepo;
    this.codeTranslationRepo = codeTranslationRepo;
  }

  async init(): Promise<void> {
    await this.loadCache();
  }

  async getCodeTableId(codeType: string, enumValue: string): Promise<number> {
    const cached = this.codeTableCache.get(codeType);
    if (cached) {
      const entry = cached.find((c) => c.code === enumValue);
      if (entry) return entry.id;
    }

    const entry = await this.codeTableRepo.findByCodeTypeAndCode(codeType, enumValue, true);
    if (!entry) {
      throw new Error(`CodeTable entry not found for ${codeType}.${enumValue}`);
    }
    return entry.id;
  }

  async isOrderTypeEnabled(enumValue: string): Promise<boolean> {
    const entry = await this.codeTableRepo.findByCodeTypeAndCode('ORDER_TYPE', enumValue, true);
    return entry?.isActive ?? false;
  }

  async setOrderTypeEnabled(enumValue: string, isEnabled: boolean): Promise<void> {
    const entry = await this.codeTableRepo.findByCodeTypeAndCode('ORDER_TYPE', enumValue, true);
    if (entry) {
      await this.codeTableRepo.update(entry.id, { isActive: isEnabled });
      // Clear cache to ensure fresh data
      this.codeTableCache.delete('ORDER_TYPE');
      this.reverseCache.clear();
      await this.loadCache();
    }
  }

  async getEnumFromId(id: number): Promise<{ codeType: string; code: string }> {
    if (id === undefined || id === null) {
      throw new Error('getEnumFromId: id is required');
    }
    const cached = this.reverseCache.get(id);
    if (cached) {
      return cached;
    }

    const entry = await this.codeTableRepo.findById(id);
    if (!entry) {
      throw new Error(`CodeTable entry not found for id ${id}`);
    }

    const result = { codeType: entry.codeType, code: entry.code };
    this.reverseCache.set(id, result);
    return result;
  }

  async getEnumFromCode(
    code: string,
    codeType = 'USER_ROLE',
  ): Promise<{ id: number; code: string; codeType: string }> {
    const entry = await this.codeTableRepo.findByCodeTypeAndCode(codeType, code);
    if (!entry) {
      throw new Error(`CodeTable entry not found for ${codeType}.${code}`);
    }
    return entry;
  }

  async getTranslation(id: number, language: string): Promise<string> {
    if (id === undefined || id === null) {
      return '';
    }
    const translation = await this.codeTranslationRepo.findByCodeTableIdAndLanguage(id, language);
    return translation?.label || '';
  }

  async getCodeTableByType(codeType: string): Promise<CodeTable[]> {
    const cached = this.codeTableCache.get(codeType);
    if (cached) {
      return cached;
    }

    const entries = await this.codeTableRepo.findByCodeType(codeType);
    this.codeTableCache.set(codeType, entries);
    return entries;
  }

  private async loadCache(): Promise<void> {
    const allEntries = await this.codeTableRepo.findAll();

    this.codeTableCache.clear();
    this.reverseCache.clear();

    for (const entry of allEntries) {
      const existing = this.codeTableCache.get(entry.codeType) || [];
      existing.push(entry);
      this.codeTableCache.set(entry.codeType, existing);

      this.reverseCache.set(entry.id, {
        codeType: entry.codeType,
        code: entry.code,
      });
    }
  }
}
