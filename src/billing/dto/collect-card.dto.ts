import { IsString, IsNumber } from 'class-validator';

export class CollectCardPaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  card_number: string;

  @IsString()
  cvv: string;

  @IsString()
  expiry_month: string;

  @IsString()
  expiry_year: string;

  @IsString()
  email: string;

  @IsString()
  tx_ref: string;

  @IsString()
  payment_plan: string;
}