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
      return await this.billingService.findOne(req);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.billingService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
