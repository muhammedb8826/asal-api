import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class PaymentApplicationDto {
  @IsUUID()
  invoiceId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CreateSupplierPaymentDto {
  @IsOptional()
  @IsString()
  series?: string;

  @IsUUID()
  supplierId: string;

  @IsDateString()
  paymentDate: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  status?: string; // DRAFT, POSTED (defaults to POSTED)

  @IsOptional()
  @IsNotEmpty()
  applications?: PaymentApplicationDto[]; // Invoices to apply payment to
}
