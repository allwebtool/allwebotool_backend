import { Controller, Post, Body, Param, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Request } from 'express';


type VerifyPaymentDto = {
  email: string;
  tx_ref: string;
  transaction_id: string;
  status: string;
};

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Endpoint to initialize payment
  @Post('initialize')
  async initializePayment(
    @Req() req:Request,
    @Body('amount') amount: number,
  ) {
    console.log(amount, req.user)
    const user:any = req.user
    return await this.billingService.initializePayment(user.email as string, amount);
  }

  // Endpoint to verify a payment
  @Post('verify')
  async verifyPayment(
    @Body('transaction_id') transaction_id: string,
    @Body('tx_ref') tx_ref: string,
    @Body('status') status: string,
    @Req() req: Request,
  ) {
    const user:any = req.user
    const verifyPaymentData:VerifyPaymentDto ={
      email: user.email,
      tx_ref, 
      transaction_id,
      status
    }

    return await this.billingService.verifyPayment(verifyPaymentData);
  }

  // Auto-bill endpoint to charge a saved card token
  @Post('auto-bill')
  async autoBill(
    @Body('token') token: string,
    @Req() req: Request,
    @Body('amount') amount: number,
  ) {
    return await this.billingService.autoBill(token, req.user as string, amount);
  }

  @Post('givepoint')
  async giverNeverLack(
    @Body('userId') userId: string,
    @Body('points') points: number,
  ) {
    return await this.billingService.givePoint(userId, points);
  }
}