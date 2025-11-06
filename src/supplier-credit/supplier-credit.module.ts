import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierCredit } from '../entities/supplier-credit.entity';
import { CreditApplication } from '../entities/credit-application.entity';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { SupplierCreditService } from './supplier-credit.service';
import { SupplierCreditController } from './supplier-credit.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierCredit, CreditApplication, ApInvoice]),
  ],
  controllers: [SupplierCreditController],
  providers: [SupplierCreditService],
  exports: [SupplierCreditService],
})
export class SupplierCreditModule {}
