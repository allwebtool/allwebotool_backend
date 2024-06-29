import { IsOptional, IsString } from "class-validator";

export class UpdateBillingDto {
    @IsString()
    @IsOptional()
    customer_id?: string;
  
    @IsString()
    @IsOptional()
    plan_id?: string;
  }
