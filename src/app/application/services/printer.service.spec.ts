import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PrinterService } from './printer.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { OrderService } from './order.service';
import { ProductService } from './product.service';
import { VariantService } from './variant.service';
import { ExtraService } from './extra.service';
import { TableService } from './table.service';
import { EnumMappingService } from './enum-mapping.service';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('PrinterService', () => {
  let service: PrinterService;
  let platformService: any;
  let orderService: any;
  let productService: any;
  let variantService: any;
  let extraService: any;
  let tableService: any;
  let enumMappingService: any;

  beforeEach(() => {
    const platformMock = {
      isTauri: vi.fn().mockReturnValue(false),
      isWeb: vi.fn().mockReturnValue(true),
    };

    const orderServiceMock = {
      getOrderById: vi.fn(),
      getOrderItems: vi.fn(),
      getOrderItemExtras: vi.fn(),
    };

    const productServiceMock = { getById: vi.fn() };
    const variantServiceMock = { getById: vi.fn() };
    const extraServiceMock = { getById: vi.fn() };
    const tableServiceMock = { getById: vi.fn() };
    const enumMappingServiceMock = { getTranslation: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        PrinterService,
        { provide: PlatformService, useValue: platformMock },
        { provide: OrderService, useValue: orderServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: VariantService, useValue: variantServiceMock },
        { provide: ExtraService, useValue: extraServiceMock },
        { provide: TableService, useValue: tableServiceMock },
        { provide: EnumMappingService, useValue: enumMappingServiceMock },
      ],
    });

    service = TestBed.inject(PrinterService);
    platformService = TestBed.inject(PlatformService);
    orderService = TestBed.inject(OrderService);
    productService = TestBed.inject(ProductService);
    variantService = TestBed.inject(VariantService);
    extraService = TestBed.inject(ExtraService);
    tableService = TestBed.inject(TableService);
    enumMappingService = TestBed.inject(EnumMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update config', () => {
    const newConfig = {
      receipt: { connection: 'tcp:1.1.1.1:9100', width: 42 },
    };
    service.updateConfig(newConfig);
    expect((service as any).config.receipt.connection).toBe('tcp:1.1.1.1:9100');
    expect((service as any).config.receipt.width).toBe(42);
  });

  it('should call invoke when printing via Tauri', async () => {
    platformService.isTauri.mockReturnValue(true);

    // Mock data for testPrinter
    await service.testPrinter('receipt');

    expect(invoke).toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith(
      'print_raw',
      expect.objectContaining({
        connection: expect.any(String),
        data: expect.any(Array),
      }),
    );
  });

  it('should use web print fallback when not in Tauri', async () => {
    platformService.isTauri.mockReturnValue(false);

    // Mock window.open
    const mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
      close: vi.fn(),
      onload: null as any,
    };

    const windowSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow as any);

    await service.testPrinter('receipt');

    expect(windowSpy).toHaveBeenCalled();
    expect(mockWindow.document.write).toHaveBeenCalled();

    // Simulate onload
    if (mockWindow.onload) {
      mockWindow.onload();
      expect(mockWindow.print).toHaveBeenCalled();
    }

    windowSpy.mockRestore();
  });

  it('should generate receipt data and format correctly', async () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-001',
      typeId: 1,
      statusId: 1,
      createdAt: new Date().toISOString(),
      subtotal: 10,
      tax: 1.8,
      tip: 0,
      total: 11.8,
    };

    orderService.getOrderById.mockResolvedValue(mockOrder);
    orderService.getOrderItems.mockResolvedValue([
      { id: 1, productId: 1, quantity: 1, unitPrice: 10, notes: 'No onion' },
    ]);
    orderService.getOrderItemExtras.mockResolvedValue([]);
    productService.getById.mockResolvedValue({ id: 1, name: 'Burger', price: 10 });
    enumMappingService.getTranslation.mockResolvedValue('Dine In');

    // Test data preparation logic
    const data = await (service as any).prepareReceiptData(1, 'en');

    expect(data.order.orderNumber).toBe('ORD-001');
    expect(data.items.length).toBe(1);
    expect(data.items[0].product.name).toBe('Burger');
  });

  it('should format ESC/POS correctly for items', () => {
    const mockData = {
      order: {
        orderNumber: '123',
        createdAt: new Date(),
        subtotal: 10,
        tax: 1.8,
        tip: 1,
        total: 12.8,
      },
      orderType: 'Dine In',
      items: [
        {
          product: { name: 'Burger' },
          quantity: 1,
          lineTotal: 10,
          variant: null,
          extras: [],
          notes: null,
        },
      ],
      table: { number: 5 },
      language: 'en',
    };

    const escpos = (service as any).generateReceiptESCPOS(mockData);

    expect(escpos).toContain('SIMPLE BISTRO');
    expect(escpos).toContain('Burger');
    expect(escpos).toContain('TOTAL');
    expect(escpos).toContain('\x1DV\x41\x00'); // Cut command
  });
});
