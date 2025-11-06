import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SupplierPaymentService } from './supplier-payment.service';
import { CreateSupplierPaymentDto } from './dto/create-payment.dto';

@Controller('supplier-payments')
export class SupplierPaymentController {
  constructor(private readonly service: SupplierPaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSupplierPaymentDto) {
    return this.service.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('q') q?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.service.findAll(Number(page), Number(limit), q, supplierId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {};
  }
}
