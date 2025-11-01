import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UOM } from '../entities/uom.entity';
import { UomService } from './uom.service';
import { UomController } from './uom.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UOM])],
  controllers: [UomController],
  providers: [UomService],
  exports: [UomService],
})
export class UomModule {}
