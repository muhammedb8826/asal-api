import { PartialType } from '@nestjs/mapped-types';
import {
  CreatePurchaseDto,
  CreatePurchaseItemDto,
} from './create-purchase.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items?: CreatePurchaseItemDto[];
}
