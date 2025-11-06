import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reports')
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Get('ap-aging')
  @HttpCode(HttpStatus.OK)
  getAgingReport() {
    return this.service.getAgingReport();
  }

  @Get('suppliers/:supplierId/statement')
  @HttpCode(HttpStatus.OK)
  getSupplierStatement(@Param('supplierId') supplierId: string) {
    return this.service.getSupplierStatement(supplierId);
  }

  @Get('variance')
  @HttpCode(HttpStatus.OK)
  getVarianceReport(@Query('purchaseId') purchaseId?: string) {
    return this.service.getVarianceReport(purchaseId);
  }
}
