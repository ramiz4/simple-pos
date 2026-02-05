export interface Order {
  id: number;
  orderNumber: string;
  typeId: number; // FK to CodeTable (ORDER_TYPE)
  statusId: number; // FK to CodeTable (ORDER_STATUS)
  tableId: number | null; // FK to Table (required for DINE_IN)
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  createdAt: string;
  completedAt: string | null;
  userId: number; // FK to User
  cancelledReason: string | null;
  customerName?: string;
}
