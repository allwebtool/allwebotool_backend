import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class verifyOtpDTO {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    token: string;
}