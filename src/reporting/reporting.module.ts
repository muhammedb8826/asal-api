import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { SupplierCredit } from '../entities/supplier-credit.entity';
import { PaymentApplication } from '../entities/payment-application.entity';
import { CreditApplication } from '../entities/credit-application.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { ApInvoiceItem } from '../entities/ap-invoice-item.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApInvoice,
      SupplierPayment,
      SupplierCredit,
      PaymentApplication,
      CreditApplication,
      GrnItem,
      ApInvoiceItem,
      PurchaseItems,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
