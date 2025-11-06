import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApInvoiceService } from './ap-invoice.service';
import { CreateApInvoiceDto } from './dto/create-ap-invoice.dto';
import { UpdateApInvoiceDto } from './dto/update-ap-invoice.dto';

@Controller('ap-invoices')
export class ApInvoiceController {
  constructor(private readonly service: ApInvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApInvoiceDto) {
    return this.service.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('q') q?: string,
  ) {
    return this.service.findAll(Number(page), Number(limit), q);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/outstanding')
  @HttpCode(HttpStatus.OK)
  getOutstanding(@Param('id') id: string) {
    return this.service.getOutstanding(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdateApInvoiceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {};
  }
}
