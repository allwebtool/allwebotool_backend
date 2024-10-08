import { BadRequestException, ForbiddenException, HttpStatus, Injectable, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as argon from "argon2"
import { SignUpResponse } from 'types';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';  
import { EmailService } from 'src/email/email.service';
import { verifyOtpDTO } from './dto/verifyotp.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { RequestResetDto } from './dto/requestReset.dto';
import axios from 'axios';

@Injectable()
export class AuthService {
    constructor(
      private readonly prisma: PrismaService, 
      private readonly jwtService:JwtService,
      private readonly mailService: EmailService
      ){}

      async signUpLocal(dto: RegisterDto, request: any): Promise<SignUpResponse> {
        
        // Convert username to lowercase
        const lowerCaseUsername = dto.username.toLowerCase();
    
        // Check if email already exists
        const existingEmailUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
    
        if (existingEmailUser) {
            throw new BadRequestException('Email already exists');
        }
    
        // Check if username already exists (after converting to lowercase)
        const existingUsernameUser = await this.prisma.user.findUnique({
            where: {
                username: lowerCaseUsername,
            },
        });
    
        if (existingUsernameUser) {
            throw new BadRequestException('Username already exists');
        }
        
        // Perform VPN and Device Fingerprint Checks
        const userIp = request.ip;
        const userAgent = request.headers['user-agent'];
    
        // Check if the IP address belongs to a VPN (Using a VPN detection API)
        const vpnStatus = await this.checkIfUsingVPN(userIp);
        if (vpnStatus) {
            throw new BadRequestException('VPN usage detected. Registration is not allowed through VPNs.');
        }
    
        // Check device fingerprinting
        const deviceFingerprint = dto.deviceFingerprint; // Obtain this from the frontend (e.g., FingerprintJS or ClientJS)
        console.log(deviceFingerprint, userIp, userAgent)
        const existingDeviceUser = await this.prisma.user.findFirst({
            where: {
                deviceFingerprint: deviceFingerprint,
            },
        });
    
        if (existingDeviceUser) {
            throw new BadRequestException('This device has already been used to create an account.');
        }
    
        // Hash the password
        const hash = await this.hashData(dto.password);
    
        // Generate OTP token and hash
        const token = Math.floor(1000 + Math.random() * 9000).toString();
    
        // Create the new user with device fingerprinting and IP address logging
        const newUser = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                role: dto.role,
                username: lowerCaseUsername,
                hash: hash,
                otp_token: token,
                from_where: dto.from_where,
                ip_address: userIp,
                user_agent: userAgent,
                deviceFingerprint: deviceFingerprint, // Save device fingerprint
            },
        });
    
        // Credit initial points to the user’s account
        await this.prisma.transaction.create({
            data: {
                userId: newUser.id,
                amount: 0,
                points: 25,
                type: 'credit',
                status: 'successful',
            },
        });
    
        // Send OTP email
        await this.mailService.sendOTP(newUser, token);
    
        return { email: newUser.email };
    }
    
    async checkIfUsingVPN(ip: string): Promise<boolean> {
      try {
          const response = await axios.get(`https://vpnapi.io/api/${ip}?key=your_api_key`);
          console.log(response)
          return response.data.security.vpn; // Assuming the response returns a `vpn` field
      } catch (error) {
          console.error('Failed to check VPN status:', error);
          return false; // If VPN check fails, allow registration by default
      }
  }
  

    async signInLocal(dto: AuthDto, res: Response){
        try {
          const user = await this.prisma.user.findFirst({
            where: {
              OR: [
                { username: dto.user.toLowerCase() },
                { email: dto.user.toLowerCase() }
              ]
            }
          });
          if (!user) {
            throw new ForbiddenException('Invalid Credential');
          }
          
          const passwordMatches = await argon.verify(user.hash, dto.password)
          if (!passwordMatches) {
            throw new UnauthorizedException('Authentication failed. Please check your credentials.')
          }
          const tokens = await this.getToken(user.id, user.email);

          await this.updateRtHash(user.id, tokens.refresh_token);

          if(!user.email_verified){
            const token = Math.floor(1000 + Math.random() * 9000).toString();
            await this.prisma.user.update({
              where:{id: user.id},
              data:{
                otp_token: token
              }
            })
            await this.mailService.sendOTP(user, token);

            return res.status(HttpStatus.NOT_ACCEPTABLE).json({
              email: user.email,
              message:"Email verification required"
            })
          }
          
          res.cookie('refresh_token', tokens.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV !== 'dev', sameSite:"none" });
          return res.status(HttpStatus.OK).json({
            access_token: tokens.access_token,
            role: user.role,
            email: user.email
          })
        } catch (error) {
          res.status(error.status).json({
            message:error
          })
        }
      }
      
    async logout(userId: string, req: Request, res: Response){
      const rt2bd = req.cookies["refresh_token"]
      
      await this.prisma.rtHash.deleteMany({
        where: {
          userId,
          rtHash: rt2bd
        }
      })

      res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: process.env.NODE_ENV !== 'dev' })
      res.status(HttpStatus.OK).json({message:"Logged Out"})
    }

    async refresh(req: Request, res: Response) {
      try {
        const refreshToken = req.cookies["refresh_token"];
        
        if (!refreshToken) {
          throw new UnauthorizedException('No refresh token provided');
        }
    
        const decodedToken = await this.jwtService.verifyAsync(refreshToken, {
          secret: process.env.REFRESH_TOKEN_SECRET,
        });
    
        const userId = decodedToken.sub;
    
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
    
        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        const hashRt = await this.prisma.rtHash.findFirst({where:{userId: user.id}})
    
        if (!hashRt) {
          throw new UnauthorizedException('Invalid refresh token');
        }
    
        const tokens = await this.getToken(userId, user.email);

        await this.prisma.rtHash.update({
          where: { id: hashRt.id },
          data: { rtHash: tokens.refresh_token },
        });
    
        // Set the new refresh token in the cookie
        res.cookie('refresh_token', tokens.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV !== 'dev' });
    
        // Send back the new access token
        res.status(HttpStatus.OK).json({
          access_token: tokens.access_token,
          role: user.role,
          email: user.email
        });
      } catch (error) {
        console.log(error)
        throw new UnauthorizedException('You\'re not logged in.');
      }
    }
 
    async verifyOTP(dto:verifyOtpDTO): Promise<{message:string}> {
      try {
          const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
          if (!user) {
              throw new BadRequestException("User not found");
          }
          if(user.email_verified===true){
            return {message: "User is verified already. Please re-login"}
          }
          console.log(user)
  
          const hash = user.otp_token
          // Verify OTP
          const isVerified = Boolean(parseInt(hash) === parseInt(dto.token))
          console.log(isVerified, hash, dto.token)
          if (!isVerified) {
              throw new BadRequestException("Invalid OTP");
          }
  
          // Clear OTP hash after successful verification
          await this.prisma.user.update({
              where: { id: user.id },
              data: { email_verified: true, otp_token: "" }
          });
  
          return { message: "Email verified successfully" };
      } catch (e) {
          throw new BadRequestException(e.message);
      }
  }

  async requestOTP(dto: any): Promise<SignUpResponse>{
    try {
        const user = await this.prisma.user.findFirst({where:{email: dto.email}})
        if (!user) {
          throw new ForbiddenException('User not found');
        }

        const token = Math.floor(1000 + Math.random() * 9000).toString();
        await this.prisma.user.updateMany({where:{email: user.email}, data:{otp_token: token}})

        await this.mailService.sendOTP(user, token);
        return {
          email: user.email
        }
      } catch (e) {
          throw new ForbiddenException(e.message);
      }
  }
  
  
  hashData(data: string){
      return argon.hash(data)
  }

  async getToken(userId: string, email: string){
      const accessToken= this.jwtService.signAsync({
          sub: userId,
          email
      },{
          secret: process.env.ACCESS_TOKEN_SECRET,
          expiresIn: 60 * 60 * 7,
      })

      const refreshToken= this.jwtService.signAsync({
          sub: userId,
          email
      },{
          secret: process.env.REFRESH_TOKEN_SECRET,
          expiresIn: 60 * 60 * 24 * 60,
      })

      const [at,rt] = await Promise.all([accessToken, refreshToken])

      return {
          access_token: at,
          refresh_token: rt
      }
  }

  async updateRtHash(userId: string, rt: string){
      

      
      await this.prisma.rtHash.create({
          data: {rtHash: rt, userId: userId}
      })
      return
  }

  async requestPasswordReset(dto: RequestResetDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: process.env.RESET_PASSWORD_SECRET, expiresIn: '1h' }
    );

    await this.mailService.sendPasswordReset(user, token);

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto, req?: Request): Promise<{ message: string }> {
    
    const usr:any = req.user
    console.log(usr)
    let user: any = {}
    if(usr.email){
     user = await this.prisma.user.findFirst({
      where: { email: usr.email },
    });
    }else{
      const decodedToken = await this.jwtService.verifyAsync(dto.token, {
        secret: process.env.RESET_PASSWORD_SECRET,
      })
      user = await this.prisma.user.findUnique({
        where: { id: decodedToken.sub },
      });
    }
     

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const hash = await argon.hash(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { hash },
    });

    return { message: 'Password reset successful' };
  }

}

