import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GRN } from '../entities/grn.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';
import { Product } from '../entities/product.entity';
import { UOM } from '../entities/uom.entity';
import { GrnService } from './grn.service';
import { GrnController } from './grn.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GRN,
      GrnItem,
      Purchase,
      PurchaseItems,
      Product,
      UOM,
    ]),
  ],
  controllers: [GrnController],
  providers: [GrnService],
  exports: [GrnService],
})
export class GrnModule {}
