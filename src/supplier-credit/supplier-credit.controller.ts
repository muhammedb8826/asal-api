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
import { SupplierCreditService } from './supplier-credit.service';
import { CreateSupplierCreditDto } from './dto/create-credit.dto';

@Controller('supplier-credits')
export class SupplierCreditController {
  constructor(private readonly service: SupplierCreditService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSupplierCreditDto) {
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
