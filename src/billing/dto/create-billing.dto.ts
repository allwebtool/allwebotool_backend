import { IsNotEmpty, IsString} from 'class-validator';

export class CreateBillingDto {
  @IsString()
  @IsNotEmpty()
  customer_id: number;

  @IsString()
  @IsNotEmpty()
  plan_id: string;
}
