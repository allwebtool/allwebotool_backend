import { Controller, Get, Post, Body, Patch, Param, Delete,  HttpException, HttpStatus, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Request } from 'express';
import { PublicRoute } from 'common/decorator/public.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  async create(@Body() createBillingDto: CreateBillingDto) {
    try {
      return await this.billingService.create(createBillingDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.billingService.findAll();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('subscribe')
  async findOne(@Req() req: Request) {
    try {
      return await this.billingService.checkSubscriptionStatus(req);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }


  @Get('transactions')
  async findSubs(@Req() req: Request) {
    try {
      return await this.billingService.checkCustomerTransactions(req);
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBillingDto: UpdateBillingDto) {
    try {
      return await this.billingService.update(+id, updateBillingDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
