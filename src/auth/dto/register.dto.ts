import { Optional } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    from_where: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    role: number;

    @IsNotEmpty()
    @IsString()
    username: string;

    @Optional()
    deviceFingerprint: string
}