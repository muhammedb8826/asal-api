import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreditApplicationDto {
  @IsUUID()
  invoiceId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CreateSupplierCreditDto {
  @IsOptional()
  @IsString()
  series?: string;

  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @IsOptional()
  @IsDateString()
  creditDate?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsOptional()
  @IsString()
  status?: string; // DRAFT, POSTED (defaults to DRAFT)

  @IsOptional()
  applications?: CreditApplicationDto[]; // Invoices to apply credit to
}
