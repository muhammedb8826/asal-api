import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateUomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  abbreviation: string;

  // decimal string, positive, up to 18,9
  @IsString()
  @Matches(/^\d{1,9}(?:\.\d{1,9})?$/, {
    message:
      'conversionRate must be a positive decimal string with up to 18,9 precision',
  })
  conversionRate: string;

  @IsBoolean()
  baseUnit: boolean;

  @IsUUID()
  unitCategoryId: string;

  // Optional: for compatibility; not in entity as separate fields
  @IsOptional()
  @IsString()
  description?: string;
}
