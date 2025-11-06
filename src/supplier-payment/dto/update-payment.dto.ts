import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierPaymentDto } from './create-payment.dto';

export class UpdateSupplierPaymentDto extends PartialType(
  CreateSupplierPaymentDto,
) {}
