import { TestBed } from '@angular/core/testing';
import { SeedService } from '../application/services/seed.service';
import { EnumMappingService } from '../application/services/enum-mapping.service';
import { IndexedDBService } from '../infrastructure/services/indexeddb.service';
import { PlatformService } from '../shared/utilities/platform.service';
import { SQLiteCodeTableRepository } from '../infrastructure/repositories/sqlite-code-table.repository';
import { IndexedDBCodeTableRepository } from '../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../infrastructure/repositories/sqlite-code-translation.repository';
import { IndexedDBCodeTranslationRepository } from '../infrastructure/repositories/indexeddb-code-translation.repository';
import { TableStatusEnum, OrderTypeEnum, OrderStatusEnum, UserRoleEnum } from '../domain/enums';

describe('CodeTable System Integration', () => {
  let seedService: SeedService;
  let enumMappingService: EnumMappingService;
  let codeTableRepo: IndexedDBCodeTableRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SeedService,
        EnumMappingService,
        IndexedDBService,
        PlatformService,
        IndexedDBCodeTableRepository,
        IndexedDBCodeTranslationRepository,
        { provide: SQLiteCodeTableRepository, useValue: {} },
        { provide: SQLiteCodeTranslationRepository, useValue: {} },
      ],
    });

    seedService = TestBed.inject(SeedService);
    enumMappingService = TestBed.inject(EnumMappingService);
    codeTableRepo = TestBed.inject(IndexedDBCodeTableRepository);

    // Ensure we are in "web" mode for these tests (using IndexedDB)
    const platformService = TestBed.inject(PlatformService);
    vi.spyOn(platformService, 'isTauri').mockReturnValue(false);
    vi.spyOn(platformService, 'isWeb').mockReturnValue(true);
  });

  it('should seed CodeTable data successfully', async () => {
    // Seed the database
    await seedService.seedDatabase();

    // Verify TABLE_STATUS codes exist
    const tableStatuses = await codeTableRepo.findByCodeType('TABLE_STATUS');
    expect(tableStatuses.length).toBeGreaterThanOrEqual(3);
    
    const freeStatus = tableStatuses.find(s => s.code === TableStatusEnum.FREE);
    expect(freeStatus).toBeDefined();
    expect(freeStatus?.isActive).toBe(true);

    // Verify ORDER_TYPE codes exist
    const orderTypes = await codeTableRepo.findByCodeType('ORDER_TYPE');
    expect(orderTypes.length).toBeGreaterThanOrEqual(3);
    
    const dineInType = orderTypes.find(t => t.code === OrderTypeEnum.DINE_IN);
    expect(dineInType).toBeDefined();

    // Verify ORDER_STATUS codes exist
    const orderStatuses = await codeTableRepo.findByCodeType('ORDER_STATUS');
    expect(orderStatuses.length).toBeGreaterThanOrEqual(7);
    
    const openStatus = orderStatuses.find(s => s.code === OrderStatusEnum.OPEN);
    expect(openStatus).toBeDefined();

    // Verify USER_ROLE codes exist
    const userRoles = await codeTableRepo.findByCodeType('USER_ROLE');
    expect(userRoles.length).toBeGreaterThanOrEqual(4);
    
    const adminRole = userRoles.find(r => r.code === UserRoleEnum.ADMIN);
    expect(adminRole).toBeDefined();
  });

  it('should map enums to CodeTable IDs', async () => {
    // Seed the database first
    await seedService.seedDatabase();

    // Test enum to ID mapping
    const freeStatusId = await enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
    expect(freeStatusId).toBeGreaterThan(0);

    const dineInTypeId = await enumMappingService.getCodeTableId('ORDER_TYPE', OrderTypeEnum.DINE_IN);
    expect(dineInTypeId).toBeGreaterThan(0);

    const openStatusId = await enumMappingService.getCodeTableId('ORDER_STATUS', OrderStatusEnum.OPEN);
    expect(openStatusId).toBeGreaterThan(0);

    const adminRoleId = await enumMappingService.getCodeTableId('USER_ROLE', UserRoleEnum.ADMIN);
    expect(adminRoleId).toBeGreaterThan(0);
  });

  it('should retrieve enum from CodeTable ID', async () => {
    // Seed the database first
    await seedService.seedDatabase();

    // Get a CodeTable ID
    const freeStatusId = await enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
    
    // Retrieve the enum back
    const result = await enumMappingService.getEnumFromId(freeStatusId);
    expect(result.codeType).toBe('TABLE_STATUS');
    expect(result.code).toBe(TableStatusEnum.FREE);
  });

  it('should get translation for enum', async () => {
    // Seed the database first
    await seedService.seedDatabase();

    // Get CodeTable IDs first
    const freeStatusId = await enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
    const dineInId = await enumMappingService.getCodeTableId('ORDER_TYPE', OrderTypeEnum.DINE_IN);
    const adminId = await enumMappingService.getCodeTableId('USER_ROLE', UserRoleEnum.ADMIN);

    // Get English translations
    const freeStatusEn = await enumMappingService.getTranslation(freeStatusId, 'en');
    expect(freeStatusEn).toBe('Free');

    // Get Albanian translation
    const freeStatusSq = await enumMappingService.getTranslation(freeStatusId, 'sq');
    expect(freeStatusSq).toBe('I Lirë');

    // Test other enums
    const dineInEn = await enumMappingService.getTranslation(dineInId, 'en');
    expect(dineInEn).toBe('Dine In');

    const adminEn = await enumMappingService.getTranslation(adminId, 'en');
    expect(adminEn).toBe('Admin');
  });

  it('should not create duplicate seed data', async () => {
    // Seed twice
    await seedService.seedDatabase();
    await seedService.seedDatabase();

    // Verify no duplicates
    const tableStatuses = await codeTableRepo.findByCodeType('TABLE_STATUS');
    const freeStatuses = tableStatuses.filter(s => s.code === TableStatusEnum.FREE);
    expect(freeStatuses.length).toBe(1);
  });
});
