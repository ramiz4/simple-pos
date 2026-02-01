import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../../infrastructure/repositories/sqlite-code-translation.repository';
import { IndexedDBCodeTranslationRepository } from '../../infrastructure/repositories/indexeddb-code-translation.repository';
import { CodeTable } from '../../domain/entities/code-table.interface';
@Injectable({
  providedIn: 'root'
})
export class EnumMappingService {
  private codeTableCache: Map<string, CodeTable[]> = new Map();
  private reverseCache: Map<number, { codeType: string; code: string }> = new Map();

  constructor(
    private platformService: PlatformService,
    private sqliteCodeTableRepo: SQLiteCodeTableRepository,
    private indexedDBCodeTableRepo: IndexedDBCodeTableRepository,
    private sqliteCodeTranslationRepo: SQLiteCodeTranslationRepository,
    private indexedDBCodeTranslationRepo: IndexedDBCodeTranslationRepository
  ) {}

  async init(): Promise<void> {
    await this.loadCache();
  }

  async getCodeTableId(codeType: string, enumValue: string): Promise<number> {
    const cached = this.codeTableCache.get(codeType);
    if (cached) {
      const entry = cached.find(c => c.code === enumValue);
      if (entry) return entry.id;
    }

    const repo = this.getCodeTableRepo();
    const entry = await repo.findByCodeTypeAndCode(codeType, enumValue);
    if (!entry) {
      throw new Error(`CodeTable entry not found for ${codeType}.${enumValue}`);
    }
    return entry.id;
  }

  async getEnumFromId(id: number): Promise<{ codeType: string; code: string }> {
    if (this.reverseCache.has(id)) {
      return this.reverseCache.get(id)!;
    }

    const repo = this.getCodeTableRepo();
    const entry = await repo.findById(id);
    if (!entry) {
      throw new Error(`CodeTable entry not found for id ${id}`);
    }

    const result = { codeType: entry.codeType, code: entry.code };
    this.reverseCache.set(id, result);
    return result;
  }

  async getTranslation(id: number, language: string): Promise<string> {
    const translationRepo = this.getCodeTranslationRepo();
    const translation = await translationRepo.findByCodeTableIdAndLanguage(id, language);
    return translation?.label || '';
  }

  async getCodeTableByType(codeType: string): Promise<CodeTable[]> {
    if (this.codeTableCache.has(codeType)) {
      return this.codeTableCache.get(codeType)!;
    }

    const repo = this.getCodeTableRepo();
    const entries = await repo.findByCodeType(codeType);
    this.codeTableCache.set(codeType, entries);
    return entries;
  }

  private async loadCache(): Promise<void> {
    const repo = this.getCodeTableRepo();
    const allEntries = await repo.findAll();
    
    this.codeTableCache.clear();
    this.reverseCache.clear();

    for (const entry of allEntries) {
      const existing = this.codeTableCache.get(entry.codeType) || [];
      existing.push(entry);
      this.codeTableCache.set(entry.codeType, existing);
      
      this.reverseCache.set(entry.id, { 
        codeType: entry.codeType, 
        code: entry.code 
      });
    }
  }

  private getCodeTableRepo() {
    return this.platformService.isTauri() 
      ? this.sqliteCodeTableRepo 
      : this.indexedDBCodeTableRepo;
  }

  private getCodeTranslationRepo() {
    return this.platformService.isTauri() 
      ? this.sqliteCodeTranslationRepo 
      : this.indexedDBCodeTranslationRepo;
  }
}
