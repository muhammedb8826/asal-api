import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { PaymentApplication } from '../entities/payment-application.entity';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { SupplierPaymentService } from './supplier-payment.service';
import { SupplierPaymentController } from './supplier-payment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierPayment, PaymentApplication, ApInvoice]),
  ],
  controllers: [SupplierPaymentController],
  providers: [SupplierPaymentService],
  exports: [SupplierPaymentService],
})
export class SupplierPaymentModule {}
