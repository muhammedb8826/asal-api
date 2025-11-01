import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUnitCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  constant: boolean;

  @IsNumber()
  constantValue: number;
}
