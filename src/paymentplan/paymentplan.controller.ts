import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PaymentPlanService } from './paymentplan.service';
import { CreatePaymentplanDto } from './dto/create-paymentplan.dto';
import { UpdatePaymentplanDto } from './dto/update-paymentplan.dto';
import { PublicRoute } from 'common/decorator/public.decorator';

@Controller('payment-plans')
export class PaymentPlanController {
  constructor(private readonly paymentPlanService: PaymentPlanService) {}

  @Get()
  @PublicRoute()
  async getPaymentPlans(){
    return this.paymentPlanService.getPaymentPlans();
  }

  @Get(":plan_id")
  @PublicRoute()
  async getPaymentPlan(@Param("plan_id") planId: number){
    return this.paymentPlanService.getPaymentPlan(planId);
  }


  @Post()
  async createPaymentPlan(@Body() createPaymentPlanDto: CreatePaymentplanDto) {
    return this.paymentPlanService.createPaymentPlan(createPaymentPlanDto);
  }

  @Put(':id')
  async updatePaymentPlan(@Param('id') planId: number, @Body() updatePaymentPlanDto: UpdatePaymentplanDto) {
    return this.paymentPlanService.updatePaymentPlan(planId, updatePaymentPlanDto);
  }

  @Delete(':id')
  async removePaymentPlan(@Param('id') planId: number) {
    return this.paymentPlanService.removePaymentPlan(planId);
  }
}
