import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SignUpResponse } from 'types';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { PublicRoute } from 'common/decorator/public.decorator';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService){}
    @PublicRoute()
    @Post('auth')
        signInLocal(@Body() dto:AuthDto, @Res() res: Response){
            this.authService.signInLocal(dto, res)
        }

    @PublicRoute()
    @Post("register")
        @HttpCode(HttpStatus.CREATED)
        signUpLocal(@Body() dto:RegisterDto, @Req() req:Request):Promise<SignUpResponse>{
            return this.authService.signUpLocal(dto, req)
        }

    @Post("logout")
        logout(@Req() req: Request, @Res() res:Response){
            const user = req.user
            return this.authService.logout(user["id"], req, res)
        }

    @PublicRoute()
    @Get("refresh")
        refresh(@Req() req:Request, @Res() res:Response){
            return this.authService.refresh(req, res)
        }

    @PublicRoute()
    @Post("otp")
        otp(@Body() dto:any): Promise<SignUpResponse>{
            return this.authService.requestOTP(dto)
        }

    @PublicRoute()
    @Post("verify_otp")
        verifyOtp(@Body() dto:any): Promise<{message:string}>{
            return this.authService.verifyOTP(dto)
        }
}
