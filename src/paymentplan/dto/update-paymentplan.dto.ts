import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdatePaymentplanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  interval?: string;
}
