import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: Request & { user: any }, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.tenantId!, req.user.id, createOrderDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.ordersService.findAll(req.tenantId!);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.findOne(req.tenantId!, id);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(req.tenantId!, id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.remove(req.tenantId!, id);
  }
}
