import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  CreateApInvoiceDto,
  CreateApInvoiceItemDto,
} from './create-ap-invoice.dto';

export class UpdateApInvoiceDto extends PartialType(CreateApInvoiceDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApInvoiceItemDto)
  items?: CreateApInvoiceItemDto[];
}
