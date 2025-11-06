import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { ApInvoiceItem } from '../entities/ap-invoice-item.entity';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';
import { UOM } from '../entities/uom.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { ApInvoiceService } from './ap-invoice.service';
import { ApInvoiceController } from './ap-invoice.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApInvoice,
      ApInvoiceItem,
      Purchase,
      PurchaseItems,
      UOM,
      GrnItem,
    ]),
  ],
  controllers: [ApInvoiceController],
  providers: [ApInvoiceService],
  exports: [ApInvoiceService],
})
export class ApInvoiceModule {}
