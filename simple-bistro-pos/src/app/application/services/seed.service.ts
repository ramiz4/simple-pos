import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../../infrastructure/repositories/sqlite-code-translation.repository';
import { IndexedDBCodeTranslationRepository } from '../../infrastructure/repositories/indexeddb-code-translation.repository';
import { TableStatusEnum, OrderTypeEnum, OrderStatusEnum, UserRoleEnum } from '../../domain/enums';

interface SeedData {
  codeType: string;
  code: string;
  sortOrder: number;
  translations: {
    en: string;
    sq: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SeedService {
  private seedData: SeedData[] = [
    { codeType: 'TABLE_STATUS', code: TableStatusEnum.FREE, sortOrder: 1, translations: { en: 'Free', sq: 'I Lirë' } },
    { codeType: 'TABLE_STATUS', code: TableStatusEnum.OCCUPIED, sortOrder: 2, translations: { en: 'Occupied', sq: 'I Zënë' } },
    { codeType: 'TABLE_STATUS', code: TableStatusEnum.RESERVED, sortOrder: 3, translations: { en: 'Reserved', sq: 'I Rezervuar' } },
    
    { codeType: 'ORDER_TYPE', code: OrderTypeEnum.DINE_IN, sortOrder: 1, translations: { en: 'Dine In', sq: 'Në Lokal' } },
    { codeType: 'ORDER_TYPE', code: OrderTypeEnum.TAKEAWAY, sortOrder: 2, translations: { en: 'Takeaway', sq: 'Me Marrë' } },
    { codeType: 'ORDER_TYPE', code: OrderTypeEnum.DELIVERY, sortOrder: 3, translations: { en: 'Delivery', sq: 'Dërgim' } },
    
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.OPEN, sortOrder: 1, translations: { en: 'Open', sq: 'I Hapur' } },
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.PAID, sortOrder: 2, translations: { en: 'Paid', sq: 'I Paguar' } },
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.PREPARING, sortOrder: 3, translations: { en: 'Preparing', sq: 'Në Përgatitje' } },
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.READY, sortOrder: 4, translations: { en: 'Ready', sq: 'Gati' } },
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.OUT_FOR_DELIVERY, sortOrder: 5, translations: { en: 'Out for Delivery', sq: 'Në Dërgim' } },
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.COMPLETED, sortOrder: 6, translations: { en: 'Completed', sq: 'I Përfunduar' } },
    { codeType: 'ORDER_STATUS', code: OrderStatusEnum.CANCELLED, sortOrder: 7, translations: { en: 'Cancelled', sq: 'I Anuluar' } },
    
    { codeType: 'USER_ROLE', code: UserRoleEnum.ADMIN, sortOrder: 1, translations: { en: 'Admin', sq: 'Administrator' } },
    { codeType: 'USER_ROLE', code: UserRoleEnum.CASHIER, sortOrder: 2, translations: { en: 'Cashier', sq: 'Arkëtar' } },
    { codeType: 'USER_ROLE', code: UserRoleEnum.KITCHEN, sortOrder: 3, translations: { en: 'Kitchen', sq: 'Kuzhinë' } },
    { codeType: 'USER_ROLE', code: UserRoleEnum.DRIVER, sortOrder: 4, translations: { en: 'Driver', sq: 'Shofër' } }
  ];

  constructor(
    private platformService: PlatformService,
    private sqliteCodeTableRepo: SQLiteCodeTableRepository,
    private indexedDBCodeTableRepo: IndexedDBCodeTableRepository,
    private sqliteCodeTranslationRepo: SQLiteCodeTranslationRepository,
    private indexedDBCodeTranslationRepo: IndexedDBCodeTranslationRepository
  ) {}

  async seedDatabase(): Promise<void> {
    const codeTableRepo = this.getCodeTableRepo();
    const codeTranslationRepo = this.getCodeTranslationRepo();

    const existingCount = await codeTableRepo.count();
    if (existingCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    for (const data of this.seedData) {
      const codeTable = await codeTableRepo.create({
        codeType: data.codeType,
        code: data.code,
        sortOrder: data.sortOrder,
        isActive: true
      });

      await codeTranslationRepo.create({
        codeTableId: codeTable.id,
        language: 'en',
        label: data.translations.en
      });

      await codeTranslationRepo.create({
        codeTableId: codeTable.id,
        language: 'sq',
        label: data.translations.sq
      });
    }

    console.log('Database seeding completed!');
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
