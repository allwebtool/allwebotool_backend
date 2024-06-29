import { IsString, IsNumber } from 'class-validator';

export class CreatePaymentplanDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsString()
  interval: string;
}
