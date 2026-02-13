import { Injectable } from '@angular/core';
import {
  Extra,
  Order,
  OrderItem,
  OrderStatusEnum,
  Product,
  Table,
  User,
  Variant,
} from '@simple-pos/shared/types';
import { invoke } from '@tauri-apps/api/core';
import { PlatformService } from '../../infrastructure/services/platform.service';
import { EnumMappingService } from './enum-mapping.service';
import { ExtraService } from './extra.service';
import { OrderService } from './order.service';
import { ProductService } from './product.service';
import { TableService } from './table.service';
import { VariantService } from './variant.service';

export interface PrinterConfig {
  receipt: {
    connection: string; // e.g. 'tcp:192.168.1.100:9100'
    width: number; // e.g. 32 or 42 characters
  };
  kitchen: {
    connection: string;
    width: number;
  };
}

export interface ReceiptData {
  order: Order;
  orderType: string;
  orderStatus: string;
  items: Array<{
    product: Product;
    variant: Variant | null;
    extras: Extra[];
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    notes: string | null;
  }>;
  table: Table | null;
  user: User | null;
  language: 'en' | 'al';
}

export interface KitchenTicketData {
  order: Order;
  orderType: string;
  items: Array<{
    product: Product;
    variant: Variant | null;
    extras: Extra[];
    quantity: number;
    notes: string | null;
    status: string; // Status code
  }>;
  table: Table | null;
}

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';
  private readonly RESET = this.ESC + '@';
  private readonly BOLD_ON = this.ESC + 'E' + '\x01';
  private readonly BOLD_OFF = this.ESC + 'E' + '\x00';
  private readonly CENTER = this.ESC + 'a' + '\x01';
  private readonly LEFT = this.ESC + 'a' + '\x00';
  private readonly CUT = this.GS + 'V' + '\x41' + '\x00';
  private readonly LARGE_TEXT = this.GS + '!' + '\x11';
  private readonly NORMAL_TEXT = this.GS + '!' + '\x00';

  private config: PrinterConfig = {
    receipt: {
      connection: 'tcp:127.0.0.1:9100', // Default to localhost for testing
      width: 32,
    },
    kitchen: {
      connection: 'tcp:127.0.0.1:9100',
      width: 32,
    },
  };

  constructor(
    private platformService: PlatformService,
    private orderService: OrderService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
  ) {}

  public getConfig(): Readonly<PrinterConfig> {
    return {
      receipt: { ...this.config.receipt },
      kitchen: { ...this.config.kitchen },
    };
  }

  /**
   * Update printer configuration
   */
  updateConfig(newConfig: Partial<PrinterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Send a test print to the specified printer
   */
  async testPrinter(type: 'receipt' | 'kitchen'): Promise<void> {
    const lines: string[] = [];
    lines.push(this.RESET);
    lines.push(this.CENTER);
    lines.push(this.LARGE_TEXT);
    lines.push(this.BOLD_ON);
    lines.push('TEST PRINT\n');
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);
    lines.push('--------------------------------\n');
    lines.push(this.LEFT);
    lines.push(`Printer: ${type.toUpperCase()}\n`);
    lines.push(
      `Connection: ${type === 'receipt' ? this.config.receipt.connection : this.config.kitchen.connection}\n`,
    );
    lines.push(`Time: ${new Date().toLocaleString()}\n`);
    lines.push('--------------------------------\n');
    lines.push(this.CENTER);
    lines.push('If you see this, the connection\nis working correctly!\n');
    lines.push('\n\n\n');
    lines.push(this.CUT);

    const commands = lines.join('');

    if (this.platformService.isTauri()) {
      await this.printViaTauri(commands, type);
    } else {
      await this.printViaWeb(
        `<div class="center bold large">TEST PRINT</div><div class="line"></div><div>Printer: ${type}</div><div>Time: ${new Date().toLocaleString()}</div>`,
      );
    }
  }

  /**
   * Print customer receipt
   */
  async printReceipt(orderId: number, language: 'en' | 'al' = 'en'): Promise<void> {
    const receiptData = await this.prepareReceiptData(orderId, language);
    const escPosCommands = this.generateReceiptESCPOS(receiptData);

    if (this.platformService.isTauri()) {
      await this.printViaTauri(escPosCommands, 'receipt');
    } else {
      await this.printViaWeb(this.formatReceiptForHTML(receiptData));
    }
  }

  /**
   * Print kitchen ticket
   */
  async printKitchenTicket(orderId: number): Promise<void> {
    const ticketData = await this.prepareKitchenTicketData(orderId);
    const escPosCommands = this.generateKitchenTicketESCPOS(ticketData);

    if (this.platformService.isTauri()) {
      await this.printViaTauri(escPosCommands, 'kitchen');
    } else {
      await this.printViaWeb(this.formatKitchenTicketForHTML(ticketData));
    }
  }

  /**
   * Prepare receipt data from order
   */
  private async prepareReceiptData(orderId: number, language: 'en' | 'al'): Promise<ReceiptData> {
    const order = await this.orderService.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const orderItems = await this.orderService.getOrderItems(orderId);

    const items = await Promise.all(
      orderItems.map(async (item: OrderItem) => {
        const product = await this.productService.getById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found for order item ${item.id}`);
        }
        const variant = item.variantId ? await this.variantService.getById(item.variantId) : null;
        const extraIds = await this.orderService.getOrderItemExtras(item.id);
        const extras = await Promise.all(extraIds.map((id) => this.extraService.getById(id)));

        return {
          product: product,
          variant,
          extras: extras.filter((e: Extra | null): e is Extra => e !== null),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
          notes: item.notes,
        };
      }),
    );

    const table = order.tableId ? await this.tableService.getById(order.tableId) : null;

    const orderTypeLabel = await this.enumMappingService.getTranslation(order.typeId, language);
    const orderStatusLabel = await this.enumMappingService.getTranslation(order.statusId, language);

    return {
      order,
      orderType: orderTypeLabel,
      orderStatus: orderStatusLabel,
      items,
      table,
      user: null, // Can be extended to fetch user data
      language,
    };
  }

  /**
   * Prepare kitchen ticket data
   */
  private async prepareKitchenTicketData(orderId: number): Promise<KitchenTicketData> {
    const order = await this.orderService.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const orderItems = await this.orderService.getOrderItems(orderId);

    const items = await Promise.all(
      orderItems.map(async (item: OrderItem) => {
        const product = await this.productService.getById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found for order item ${item.id}`);
        }
        const variant = item.variantId ? await this.variantService.getById(item.variantId) : null;
        const extraIds = await this.orderService.getOrderItemExtras(item.id);
        const extras = await Promise.all(extraIds.map((id) => this.extraService.getById(id)));

        const status = await this.enumMappingService.getEnumFromId(item.statusId);

        return {
          product: product,
          variant,
          extras: extras.filter((e: Extra | null): e is Extra => e !== null),
          quantity: item.quantity,
          notes: item.notes,
          status: status.code,
        };
      }),
    );

    const table = order.tableId ? await this.tableService.getById(order.tableId) : null;

    const orderTypeLabel = await this.enumMappingService.getTranslation(order.typeId, 'en');

    return {
      order,
      orderType: orderTypeLabel,
      items,
      table,
    };
  }

  /**
   * Generate ESC/POS commands for receipt
   */
  private generateReceiptESCPOS(data: ReceiptData): string {
    const lines: string[] = [];
    const lang = data.language;
    const width = this.config.receipt.width;

    lines.push(this.RESET);
    lines.push(this.CENTER);
    lines.push(this.LARGE_TEXT);
    lines.push(this.BOLD_ON);
    lines.push('SIMPLE BISTRO\n');
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);

    // Branding/Address
    lines.push('Prishtina, Kosovo\n');
    lines.push('Tel: +383 44 000 000\n');
    lines.push('--------------------------------\n');

    lines.push(this.LEFT);
    lines.push(this.BOLD_ON);
    lines.push(`${lang === 'en' ? 'Order' : 'Porosia'}: ${data.order.orderNumber}\n`);
    lines.push(this.BOLD_OFF);
    lines.push(`${lang === 'en' ? 'Type' : 'Lloji'}: ${data.orderType}\n`);

    if (data.table) {
      lines.push(`${lang === 'en' ? 'Table' : 'Tavolina'}: ${data.table.number}\n`);
    }

    lines.push(
      `${lang === 'en' ? 'Date' : 'Data'}: ${new Date(data.order.createdAt).toLocaleString()}\n`,
    );
    lines.push('--------------------------------\n');

    // Items Header
    lines.push(this.BOLD_ON);
    const qtyHeader = lang === 'en' ? 'Qty' : 'Sasia';
    const itemHeader = lang === 'en' ? 'Item' : 'Artikulli';
    const totalHeader = lang === 'en' ? 'Total' : 'Totali';

    // Simple 32-col layout: 4(qty) 18(name) 10(price)
    lines.push(this.formatLine(qtyHeader, itemHeader, totalHeader, width));
    lines.push(this.BOLD_OFF);
    lines.push('--------------------------------\n');

    // Items
    for (const item of data.items) {
      const name = item.product.name;
      lines.push(
        this.formatLine(`${item.quantity}x`, name, this.formatPrice(item.lineTotal), width),
      );

      if (item.variant) {
        lines.push(`    ${lang === 'en' ? 'Size' : 'Madhesia'}: ${item.variant.name}\n`);
      }

      for (const extra of item.extras) {
        lines.push(`    + ${extra.name}\n`);
      }

      if (item.notes) {
        lines.push(`    * ${lang === 'en' ? 'Note' : 'Shenim'}: ${item.notes}\n`);
      }
    }

    lines.push('--------------------------------\n');

    // Totals
    lines.push(
      this.formatLine(
        '',
        lang === 'en' ? 'Subtotal' : 'Nentotali',
        this.formatPrice(data.order.subtotal),
        width,
      ),
    );
    lines.push(
      this.formatLine(
        '',
        lang === 'en' ? 'VAT (18%)' : 'TVSH (18%)',
        this.formatPrice(data.order.tax),
        width,
      ),
    );

    if (data.order.tip > 0) {
      lines.push(
        this.formatLine(
          '',
          lang === 'en' ? 'Tip' : 'Bakshish',
          this.formatPrice(data.order.tip),
          width,
        ),
      );
    }

    lines.push('\n');
    lines.push(this.BOLD_ON);
    lines.push(this.LARGE_TEXT);
    lines.push(
      this.formatLine(
        '',
        lang === 'en' ? 'TOTAL' : 'TOTALI',
        this.formatPrice(data.order.total),
        width,
      ),
    );
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);

    lines.push('--------------------------------\n');
    lines.push(`${lang === 'en' ? 'Payment' : 'Pagesa'}: ${lang === 'en' ? 'Cash' : 'Kesh'}\n`);
    lines.push('\n');

    lines.push(this.CENTER);
    lines.push(this.BOLD_ON);
    lines.push(`${lang === 'en' ? 'Thank you!' : 'Faleminderit!'}\n`);
    lines.push(this.BOLD_OFF);
    lines.push(this.NORMAL_TEXT);
    lines.push('\n\n\n');
    lines.push(this.CUT);

    return lines.join('');
  }

  /**
   * Generate ESC/POS commands for kitchen ticket
   */
  private generateKitchenTicketESCPOS(data: KitchenTicketData): string {
    const lines: string[] = [];

    lines.push(this.RESET);
    lines.push(this.CENTER);
    lines.push(this.LARGE_TEXT);
    lines.push(this.BOLD_ON);
    lines.push('KITCHEN TICKET\n');
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);
    lines.push('================================\n');
    lines.push(this.LEFT);

    lines.push(this.BOLD_ON);
    lines.push(this.LARGE_TEXT);
    lines.push(`Order: ${data.order.orderNumber}\n`);
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);

    lines.push(`Type: ${data.orderType}\n`);

    if (data.table) {
      lines.push(this.BOLD_ON);
      lines.push(this.LARGE_TEXT);
      lines.push(`Table: ${data.table.number}\n`);
      lines.push(this.NORMAL_TEXT);
      lines.push(this.BOLD_OFF);
    }

    lines.push(`Time: ${new Date(data.order.createdAt).toLocaleTimeString()}\n`);
    lines.push('================================\n\n');

    // Items
    for (const item of data.items) {
      lines.push(this.LARGE_TEXT);
      lines.push(this.BOLD_ON);
      lines.push(`${item.quantity}x ${item.product.name.toUpperCase()}\n`);
      lines.push(this.NORMAL_TEXT);
      lines.push(this.BOLD_OFF);

      if (item.variant) {
        lines.push(`  SIZE: ${item.variant.name}\n`);
      }

      for (const extra of item.extras) {
        lines.push(`  + ${extra.name.toUpperCase()}\n`);
      }

      if (item.notes) {
        lines.push(this.BOLD_ON);
        lines.push(`  *** NOTE: ${item.notes.toUpperCase()} ***\n`);
        lines.push(this.BOLD_OFF);
      }

      lines.push('\n');
    }

    lines.push('\n\n\n');
    lines.push(this.CUT);

    return lines.join('');
  }

  /**
   * Helper to format a line with 3 columns (left, center, right)
   */
  private formatLine(col1: string, col2: string, col3: string, width: number): string {
    // Basic allocation for 32 columns: 4(col1) + 1(gap) + 16(col2) + 1(gap) + 10(col3)
    const c1W = Math.floor(width * 0.15); // 4 for 32
    const c3W = Math.floor(width * 0.3); // 9 for 32
    const c2W = width - c1W - c3W - 2;

    const c1 = col1.substring(0, c1W).padEnd(c1W);
    const c2 = col2.substring(0, c2W).padEnd(c2W);
    const c3 = col3.substring(0, c3W).padStart(c3W);

    return `${c1} ${c2} ${c3}\n`;
  }

  /**
   * Print via Tauri (native printer)
   */
  private async printViaTauri(
    escPosCommands: string,
    printerType: 'receipt' | 'kitchen',
  ): Promise<void> {
    try {
      const connection =
        printerType === 'receipt' ? this.config.receipt.connection : this.config.kitchen.connection;

      // Convert string to Uint8Array (bytes)
      // Note: For special characters, we might need a specific encoding like CP437 or ISO-8859-1
      const encoder = new TextEncoder();
      const data = Array.from(encoder.encode(escPosCommands));

      await invoke('print_raw', { connection, data });
      console.log(`Successfully printed to ${printerType} printer via ${connection}`);
    } catch (error) {
      console.error('Error printing via Tauri:', error);

      // Fallback to web print if native fails and user is in a browser-like environment
      if (this.platformService.isTauri()) {
        throw new Error(`Native printing failed: ${error}`);
      }
    }
  }

  /**
   * Print via web browser print API
   */
  private async printViaWeb(htmlContent: string): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=800,height=900');

    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            body {
              font-family: monospace;
              font-size: 12px;
              margin: 0;
              padding: 10px;
              width: 70mm;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            .item { margin: 10px 0; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      // Don't close immediately to allow user to print
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  }

  /**
   * Format receipt data as HTML
   */
  private formatReceiptForHTML(data: ReceiptData): string {
    const lang = data.language;
    const lines: string[] = [];

    lines.push('<div class="center">');
    lines.push('<div class="large bold">SIMPLE BISTRO</div>');
    lines.push('<div>Prishtina, Kosovo</div>');
    lines.push('<div>Tel: +383 44 000 000</div>');
    lines.push('<div class="line"></div>');
    lines.push('</div>');

    lines.push(
      `<div><strong>${lang === 'en' ? 'Order' : 'Porosia'}:</strong> ${data.order.orderNumber}</div>`,
    );
    lines.push(
      `<div><strong>${lang === 'en' ? 'Type' : 'Lloji'}:</strong> ${data.orderType}</div>`,
    );

    if (data.table) {
      lines.push(
        `<div><strong>${lang === 'en' ? 'Table' : 'Tavolina'}:</strong> ${data.table.number}</div>`,
      );
    }

    lines.push(
      `<div><strong>${lang === 'en' ? 'Date' : 'Data'}:</strong> ${new Date(data.order.createdAt).toLocaleString()}</div>`,
    );
    lines.push('<div class="line"></div>');

    // Header
    lines.push(
      '<div style="display: flex; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px;">',
    );
    lines.push(`<div style="width: 20%;">${lang === 'en' ? 'Qty' : 'Sas.'}</div>`);
    lines.push(`<div style="width: 50%;">${lang === 'en' ? 'Item' : 'Artik.'}</div>`);
    lines.push(
      `<div style="width: 30%; text-align: right;">${lang === 'en' ? 'Total' : 'Tot.'}</div>`,
    );
    lines.push('</div>');

    // Items
    for (const item of data.items) {
      lines.push('<div class="item">');
      lines.push('<div style="display: flex;">');
      lines.push(`<div style="width: 20%;">${item.quantity}x</div>`);
      lines.push(`<div style="width: 50%; font-weight: bold;">${item.product.name}</div>`);
      lines.push(
        `<div style="width: 30%; text-align: right;">${this.formatPrice(item.lineTotal)}</div>`,
      );
      lines.push('</div>');

      if (item.variant) {
        lines.push(
          `<div style="margin-left: 20%; font-size: 10px; color: #666;">${lang === 'en' ? 'Size' : 'Madh.'}: ${item.variant.name}</div>`,
        );
      }

      for (const extra of item.extras) {
        lines.push(
          `<div style="margin-left: 20%; font-size: 10px; color: #666;">+ ${extra.name}</div>`,
        );
      }

      if (item.notes) {
        lines.push(
          `<div style="margin-left: 20%; font-size: 10px; font-style: italic; color: #444;">* ${item.notes}</div>`,
        );
      }
      lines.push('</div>');
    }

    lines.push('<div class="line"></div>');
    lines.push(
      `<div style="margin-top: 8px;">${lang === 'en' ? 'Subtotal' : 'Nentotali'}: <span style="float: right;">${this.formatPrice(data.order.subtotal)}</span></div>`,
    );
    lines.push(
      `<div>${lang === 'en' ? 'VAT (18%)' : 'TVSH (18%)'}: <span style="float: right;">${this.formatPrice(data.order.tax)}</span></div>`,
    );

    if (data.order.tip > 0) {
      lines.push(
        `<div>${lang === 'en' ? 'Tip' : 'Bakshish'}: <span style="float: right;">${this.formatPrice(data.order.tip)}</span></div>`,
      );
    }

    lines.push('<div style="margin-top: 8px; padding-top: 8px; border-top: 2px solid #000;">');
    lines.push(
      `<div class="large bold">${lang === 'en' ? 'TOTAL' : 'TOTALI'}: <span style="float: right;">${this.formatPrice(data.order.total)}</span></div>`,
    );
    lines.push('</div>');
    lines.push('<div class="line"></div>');
    lines.push(
      `<div><strong>${lang === 'en' ? 'Payment' : 'Pagesa'}:</strong> ${lang === 'en' ? 'Cash' : 'Kesh'}</div>`,
    );
    lines.push('<br/>');
    lines.push('<div class="center bold">');
    lines.push(`<div>${lang === 'en' ? 'Thank you!' : 'Faleminderit!'}</div>`);
    lines.push('</div>');

    return lines.join('\n');
  }

  /**
   * Format kitchen ticket as HTML
   */
  private formatKitchenTicketForHTML(data: KitchenTicketData): string {
    const lines: string[] = [];

    lines.push('<div class="center">');
    lines.push('<div class="large bold">KITCHEN TICKET</div>');
    lines.push(
      '<div class="line" style="border-bottom-style: double; border-bottom-width: 3px;"></div>',
    );
    lines.push('</div>');

    lines.push(
      `<div class="large bold" style="font-size: 24px;">Order: ${data.order.orderNumber}</div>`,
    );
    lines.push(`<div><strong>Type:</strong> ${data.orderType}</div>`);

    if (data.table) {
      lines.push(
        `<div class="large bold" style="background: #000; color: #fff; padding: 4px; display: inline-block;">Table: ${data.table.number}</div>`,
      );
    }

    lines.push(
      `<div style="margin-top: 4px;"><strong>Time:</strong> ${new Date(data.order.createdAt).toLocaleTimeString()}</div>`,
    );
    lines.push(
      '<div class="line" style="border-bottom-style: double; border-bottom-width: 3px; margin: 10px 0;"></div>',
    );

    // Items
    for (const item of data.items) {
      lines.push('<div class="item" style="border-bottom: 1px solid #eee; padding-bottom: 8px;">');
      lines.push(
        `<div class="large bold" style="font-size: 20px;">${item.quantity}x ${item.product.name.toUpperCase()} ${item.status === OrderStatusEnum.READY ? '<span style="color: #22c55e;">(DONE)</span>' : ''}</div>`,
      );

      if (item.variant) {
        lines.push(
          `<div style="margin-left: 10px; font-weight: bold;">SIZE: ${item.variant.name.toUpperCase()}</div>`,
        );
      }

      for (const extra of item.extras) {
        lines.push(
          `<div style="margin-left: 10px; font-weight: bold;">+ ${extra.name.toUpperCase()}</div>`,
        );
      }

      if (item.notes) {
        lines.push(
          `<div style="margin-left: 10px; background: #eee; padding: 4px; font-weight: bold; margin-top: 4px;">*** NOTE: ${item.notes.toUpperCase()} ***</div>`,
        );
      }

      lines.push('</div>');
    }

    return lines.join('\n');
  }

  /**
   * Format price with currency symbol
   */
  private formatPrice(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }
}
