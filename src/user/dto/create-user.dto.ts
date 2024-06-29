// src/user/dto/create-user.dto.ts
import { IsString, IsEmail, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  from_where: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsInt()
  role?: number;

  @IsString()
  hash: string;

  @IsOptional()
  @IsString()
  otp_token?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;
}
