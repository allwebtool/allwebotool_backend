import { Controller, Get, Post, Body, Patch, Param, Delete,  HttpException, HttpStatus, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Request } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}



  @Get('subscribe')
  async findOne(@Req() req: Request) {
    try {
      return await this.billingService.checkSubscriptionStatus(req);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
     @Get('findme')
  async findMe(@Req() req: Request) {
    try {
      const res = await this.billingService.findOne(req);
      console.log(res)
      return res
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
  @Get('reactivate/:id')
  async reactivate(@Param('id') id: number) {
    try {
      return await this.billingService.reactivate(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

 

  @Get('deactivate/:id')
  async remove(@Param('id') id: number) {
    try {
      return await this.billingService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
