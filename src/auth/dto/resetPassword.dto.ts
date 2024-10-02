import { IsOptional } from "class-validator";

export class ResetPasswordDto {
    @IsOptional()
    token: string;

    password: string;
  }