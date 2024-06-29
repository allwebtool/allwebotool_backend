
import { IsNotEmpty, IsString } from "class-validator";

export class AuthDto {
    @IsNotEmpty()
    @IsString()
    user: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}