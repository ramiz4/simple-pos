import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { Order, OrderItem, Product, Variant, Extra, Table, User } from '../../domain/entities';
import { OrderService } from './order.service';
import { ProductService } from './product.service';
import { VariantService } from './variant.service';
import { ExtraService } from './extra.service';
import { TableService } from './table.service';
import { EnumMappingService } from './enum-mapping.service';

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
  }>;
  table: Table | null;
}

@Injectable({
  providedIn: 'root'
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

  constructor(
    private platformService: PlatformService,
    private orderService: OrderService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private tableService: TableService,
    private enumMappingService: EnumMappingService
  ) {}

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
        const variant = item.variantId ? await this.variantService.getById(item.variantId) : null;
        const extraIds = await this.orderService.getOrderItemExtras(item.id);
        const extras = await Promise.all(extraIds.map(id => this.extraService.getById(id)));

        return {
          product: product!,
          variant,
          extras: extras.filter((e: Extra | null): e is Extra => e !== null),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
          notes: item.notes
        };
      })
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
      language
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
        const variant = item.variantId ? await this.variantService.getById(item.variantId) : null;
        const extraIds = await this.orderService.getOrderItemExtras(item.id);
        const extras = await Promise.all(extraIds.map(id => this.extraService.getById(id)));

        return {
          product: product!,
          variant,
          extras: extras.filter((e: Extra | null): e is Extra => e !== null),
          quantity: item.quantity,
          notes: item.notes
        };
      })
    );

    const table = order.tableId ? await this.tableService.getById(order.tableId) : null;

    const orderTypeLabel = await this.enumMappingService.getTranslation(order.typeId, 'en');

    return {
      order,
      orderType: orderTypeLabel,
      items,
      table
    };
  }

  /**
   * Generate ESC/POS commands for receipt
   */
  private generateReceiptESCPOS(data: ReceiptData): string {
    const lines: string[] = [];
    const lang = data.language;

    lines.push(this.RESET);
    lines.push(this.CENTER);
    lines.push(this.LARGE_TEXT);
    lines.push(this.BOLD_ON);
    lines.push('SIMPLE BISTRO\n');
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);
    lines.push('------------------------\n');
    lines.push(this.LEFT);
    
    lines.push(`${lang === 'en' ? 'Order' : 'Porosia'}: ${data.order.orderNumber}\n`);
    lines.push(`${lang === 'en' ? 'Type' : 'Lloji'}: ${data.orderType}\n`);
    
    if (data.table) {
      lines.push(`${lang === 'en' ? 'Table' : 'Tavolina'}: ${data.table.number}\n`);
    }
    
    lines.push(`${lang === 'en' ? 'Date' : 'Data'}: ${new Date(data.order.createdAt).toLocaleString()}\n`);
    lines.push('------------------------\n');
    
    // Items
    for (const item of data.items) {
      lines.push(this.BOLD_ON);
      lines.push(`${item.quantity}x ${item.product.name}\n`);
      lines.push(this.BOLD_OFF);
      
      if (item.variant) {
        lines.push(`  ${lang === 'en' ? 'Size' : 'Madhesia'}: ${item.variant.name}\n`);
      }
      
      for (const extra of item.extras) {
        lines.push(`  + ${extra.name}\n`);
      }
      
      if (item.notes) {
        lines.push(`  ${lang === 'en' ? 'Note' : 'Shenim'}: ${item.notes}\n`);
      }
      
      lines.push(`  ${this.formatPrice(item.lineTotal)}\n`);
      lines.push('\n');
    }
    
    lines.push('------------------------\n');
    lines.push(`${lang === 'en' ? 'Subtotal' : 'Nentotali'}: ${this.formatPrice(data.order.subtotal)}\n`);
    lines.push(`${lang === 'en' ? 'VAT (18%)' : 'TVSH (18%)'}: ${this.formatPrice(data.order.tax)}\n`);
    
    if (data.order.tip > 0) {
      lines.push(`${lang === 'en' ? 'Tip' : 'Bakshish'}: ${this.formatPrice(data.order.tip)}\n`);
    }
    
    lines.push(this.BOLD_ON);
    lines.push(this.LARGE_TEXT);
    lines.push(`${lang === 'en' ? 'TOTAL' : 'TOTALI'}: ${this.formatPrice(data.order.total)}\n`);
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);
    lines.push('------------------------\n');
    lines.push(`${lang === 'en' ? 'Payment' : 'Pagesa'}: ${lang === 'en' ? 'Cash' : 'Cash'}\n`);
    lines.push('\n');
    lines.push(this.CENTER);
    lines.push(`${lang === 'en' ? 'Thank you!' : 'Faleminderit!'}\n`);
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
    lines.push('========================\n');
    lines.push(this.LEFT);
    
    lines.push(this.LARGE_TEXT);
    lines.push(this.BOLD_ON);
    lines.push(`Order: ${data.order.orderNumber}\n`);
    lines.push(this.NORMAL_TEXT);
    lines.push(this.BOLD_OFF);
    
    lines.push(`Type: ${data.orderType}\n`);
    
    if (data.table) {
      lines.push(this.BOLD_ON);
      lines.push(`Table: ${data.table.number}\n`);
      lines.push(this.BOLD_OFF);
    }
    
    lines.push(`Time: ${new Date(data.order.createdAt).toLocaleTimeString()}\n`);
    lines.push('========================\n\n');
    
    // Items
    for (const item of data.items) {
      lines.push(this.LARGE_TEXT);
      lines.push(this.BOLD_ON);
      lines.push(`${item.quantity}x ${item.product.name}\n`);
      lines.push(this.NORMAL_TEXT);
      lines.push(this.BOLD_OFF);
      
      if (item.variant) {
        lines.push(`  Size: ${item.variant.name}\n`);
      }
      
      for (const extra of item.extras) {
        lines.push(`  + ${extra.name}\n`);
      }
      
      if (item.notes) {
        lines.push(this.BOLD_ON);
        lines.push(`  NOTE: ${item.notes}\n`);
        lines.push(this.BOLD_OFF);
      }
      
      lines.push('\n');
    }
    
    lines.push('\n\n\n');
    lines.push(this.CUT);

    return lines.join('');
  }

  /**
   * Print via Tauri (native printer)
   */
  private async printViaTauri(escPosCommands: string, printerType: 'receipt' | 'kitchen'): Promise<void> {
    try {
      // In Tauri, we would use a custom command to send ESC/POS to printer
      // For now, we'll use the web print as fallback
      console.warn('Native printing not yet implemented, using web print');
      
      // Convert ESC/POS to readable text for web printing
      const text = escPosCommands
        .replace(new RegExp(this.ESC + '[^a-zA-Z]*[a-zA-Z]', 'g'), '')
        .replace(new RegExp(this.GS + '[^a-zA-Z]*[a-zA-Z]', 'g'), '');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<pre>' + text + '</pre>');
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error printing via Tauri:', error);
      throw new Error('Failed to print');
    }
  }

  /**
   * Print via web browser print API
   */
  private async printViaWeb(htmlContent: string): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
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
    lines.push('<div class="line"></div>');
    lines.push('</div>');
    
    lines.push(`<div><strong>${lang === 'en' ? 'Order' : 'Porosia'}:</strong> ${data.order.orderNumber}</div>`);
    lines.push(`<div><strong>${lang === 'en' ? 'Type' : 'Lloji'}:</strong> ${data.orderType}</div>`);
    
    if (data.table) {
      lines.push(`<div><strong>${lang === 'en' ? 'Table' : 'Tavolina'}:</strong> ${data.table.number}</div>`);
    }
    
    lines.push(`<div><strong>${lang === 'en' ? 'Date' : 'Data'}:</strong> ${new Date(data.order.createdAt).toLocaleString()}</div>`);
    lines.push('<div class="line"></div>');
    
    // Items
    for (const item of data.items) {
      lines.push('<div class="item">');
      lines.push(`<div class="bold">${item.quantity}x ${item.product.name}</div>`);
      
      if (item.variant) {
        lines.push(`<div style="margin-left: 10px;">${lang === 'en' ? 'Size' : 'Madhesia'}: ${item.variant.name}</div>`);
      }
      
      for (const extra of item.extras) {
        lines.push(`<div style="margin-left: 10px;">+ ${extra.name}</div>`);
      }
      
      if (item.notes) {
        lines.push(`<div style="margin-left: 10px;"><em>${lang === 'en' ? 'Note' : 'Shenim'}: ${item.notes}</em></div>`);
      }
      
      lines.push(`<div style="text-align: right;">${this.formatPrice(item.lineTotal)}</div>`);
      lines.push('</div>');
    }
    
    lines.push('<div class="line"></div>');
    lines.push(`<div><strong>${lang === 'en' ? 'Subtotal' : 'Nentotali'}:</strong> <span style="float: right;">${this.formatPrice(data.order.subtotal)}</span></div>`);
    lines.push(`<div><strong>${lang === 'en' ? 'VAT (18%)' : 'TVSH (18%)'}:</strong> <span style="float: right;">${this.formatPrice(data.order.tax)}</span></div>`);
    
    if (data.order.tip > 0) {
      lines.push(`<div><strong>${lang === 'en' ? 'Tip' : 'Bakshish'}:</strong> <span style="float: right;">${this.formatPrice(data.order.tip)}</span></div>`);
    }
    
    lines.push('<div class="line"></div>');
    lines.push(`<div class="large bold"><strong>${lang === 'en' ? 'TOTAL' : 'TOTALI'}:</strong> <span style="float: right;">${this.formatPrice(data.order.total)}</span></div>`);
    lines.push('<div class="line"></div>');
    lines.push(`<div><strong>${lang === 'en' ? 'Payment' : 'Pagesa'}:</strong> ${lang === 'en' ? 'Cash' : 'Cash'}</div>`);
    lines.push('<br/>');
    lines.push('<div class="center">');
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
    lines.push('<div class="line"></div>');
    lines.push('</div>');
    
    lines.push(`<div class="large bold">Order: ${data.order.orderNumber}</div>`);
    lines.push(`<div><strong>Type:</strong> ${data.orderType}</div>`);
    
    if (data.table) {
      lines.push(`<div class="bold">Table: ${data.table.number}</div>`);
    }
    
    lines.push(`<div><strong>Time:</strong> ${new Date(data.order.createdAt).toLocaleTimeString()}</div>`);
    lines.push('<div class="line"></div>');
    lines.push('<br/>');
    
    // Items
    for (const item of data.items) {
      lines.push('<div class="item">');
      lines.push(`<div class="large bold">${item.quantity}x ${item.product.name}</div>`);
      
      if (item.variant) {
        lines.push(`<div style="margin-left: 10px;">Size: ${item.variant.name}</div>`);
      }
      
      for (const extra of item.extras) {
        lines.push(`<div style="margin-left: 10px;">+ ${extra.name}</div>`);
      }
      
      if (item.notes) {
        lines.push(`<div style="margin-left: 10px;" class="bold">NOTE: ${item.notes}</div>`);
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
