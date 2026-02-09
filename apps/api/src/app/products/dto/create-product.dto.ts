export class CreateProductDto {
  name!: string;
  description?: string;
  price!: number;
  categoryId?: string;
  stockQuantity?: number;
  isActive?: boolean;
}
