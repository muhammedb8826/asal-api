import { PartialType } from '@nestjs/mapped-types';
import { CreateUnitCategoryDto } from './create-unit-category.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateUnitCategoryDto extends PartialType(CreateUnitCategoryDto) {
  @IsOptional()
  @IsUUID()
  id?: string;
}
