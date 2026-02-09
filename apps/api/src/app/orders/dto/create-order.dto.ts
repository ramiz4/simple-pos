export class CreateOrderItemDto {
  productId!: string;
  quantity!: number;
  price!: number;
}

export class CreateOrderDto {
  orderNumber?: string;
  status!: string;
  type?: string;
  customerId?: string;
  subtotal!: number;
  tax!: number;
  tip?: number;
  totalAmount!: number;
  items!: CreateOrderItemDto[];
}
