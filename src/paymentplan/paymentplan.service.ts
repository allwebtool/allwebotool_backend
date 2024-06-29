import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentPlanService {
  private readonly flutterwaveUrl = 'https://api.flutterwave.com/v3/payment-plans';
  private readonly flutterwaveSecret = process.env.FLW_KEY;

  constructor(private readonly prisma: PrismaService) {}

  // Fetch all payment plans from local database
  async getPaymentPlans(): Promise<any> {
    try {
      const paymentPlans = await this.prisma.paymentPlan.findMany();
      return paymentPlans;
    } catch (error) {
      throw new HttpException('Failed to fetch payment plans', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Fetch a single payment plan from local database
  async getPaymentPlan(planId: number): Promise<any> {
    try {
      const paymentPlan = await this.prisma.paymentPlan.findUnique({ where: { planId } });
      if (!paymentPlan) {
        throw new HttpException('Payment plan not found', HttpStatus.NOT_FOUND);
      }
      return paymentPlan;
    } catch (error) {
      throw new HttpException('Failed to fetch payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create a new payment plan on Flutterwave and save to local database
  async createPaymentPlan(data: any): Promise<any> {
    try {
      const { description, required_field, perk, ...flutterwaveData } = data;
      const response = await axios.post(this.flutterwaveUrl, flutterwaveData, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      const paymentPlan = response.data.data;
      console.log(paymentPlan)
      // Save to local database
      await this.prisma.paymentPlan.create({
        data: {
          planId: paymentPlan.id,
          name: paymentPlan.name,
          amount: paymentPlan.amount,
          interval: paymentPlan.interval,
          status: paymentPlan.status,
          description: description ,
          required_field: required_field,
          perk: perk,
        },
      });

      return paymentPlan;
    } catch (error) {
      console.log(error)
      throw new HttpException('Failed to create payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update a payment plan on Flutterwave and local database
  async updatePaymentPlan(planId: number, data: any): Promise<any> {
    try {
      const { description, required_field, perk, ...flutterwaveData } = data;
      const response = await axios.put(`${this.flutterwaveUrl}/${planId}`, flutterwaveData, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      const paymentPlan = response.data.data;

      // Update local database
      await this.prisma.paymentPlan.update({
        where: { planId },
        data: {
          name: paymentPlan.name,
          amount: paymentPlan.amount,
          interval: paymentPlan.interval,
          status: paymentPlan.status,
          description: description,
          required_field: required_field,
          perk: perk,
        },
      });

      return paymentPlan;
    } catch (error) {
      throw new HttpException('Failed to update payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Cancel a payment plan on Flutterwave and update local database
  async removePaymentPlan(planId: number): Promise<any> {
    try {
      const response = await axios.put(`${this.flutterwaveUrl}/${planId}/cancel`, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      const paymentPlan = response.data;

      // Update local database
      await this.prisma.paymentPlan.update({
        where: { planId },
        data: { status: 'cancelled' },
      });

      return paymentPlan;
    } catch (error) {
      throw new HttpException(error?.response?.data?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
