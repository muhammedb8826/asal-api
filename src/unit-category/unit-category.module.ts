import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from './unit-category.service';
import { UnitCategoryController } from './unit-category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UnitCategory])],
  controllers: [UnitCategoryController],
  providers: [UnitCategoryService],
  exports: [UnitCategoryService],
})
export class UnitCategoryModule {}
