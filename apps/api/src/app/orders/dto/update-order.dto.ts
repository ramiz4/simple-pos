import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

// Usually we only update status or tips
// Updating items is complex and might require separate endpoints
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
