import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

// Usually we only update status or tips
// Updating items is complex and might require separate endpoints
// Items are omitted from updates as they require transactional logic
export class UpdateOrderDto extends PartialType(OmitType(CreateOrderDto, ['items'] as const)) {}
