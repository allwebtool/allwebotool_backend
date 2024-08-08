import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaymentPlanService {
  private readonly flutterwaveUrl = 'https://api.flutterwave.com/v3/payment-plans';
  private readonly flutterwaveSecret = process.env.FLW_KEY;

  // Fetch all payment plans directly from Flutterwave
  async getPaymentPlans(): Promise<any> {
    try {
      const response = await axios.get(this.flutterwaveUrl, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      return response.data.data;
    } catch (error) {
      throw new HttpException('Failed to fetch payment plans', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Fetch a single payment plan directly from Flutterwave
  async getPaymentPlan(planId: number): Promise<any> {
    try {
      const response = await axios.get(`${this.flutterwaveUrl}/${planId}`, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      const paymentPlan = response.data.data;
      if (!paymentPlan) {
        throw new HttpException('Payment plan not found', HttpStatus.NOT_FOUND);
      }
      return paymentPlan;
    } catch (error) {
      throw new HttpException('Failed to fetch payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create a new payment plan directly on Flutterwave
  async createPaymentPlan(data: any): Promise<any> {
    try {
      const response = await axios.post(this.flutterwaveUrl, data, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      return response.data.data;
    } catch (error) {
      throw new HttpException('Failed to create payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update a payment plan directly on Flutterwave
  async updatePaymentPlan(planId: number, data: any): Promise<any> {
    try {
      const response = await axios.put(`${this.flutterwaveUrl}/${planId}`, data, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      return response.data.data;
    } catch (error) {
      throw new HttpException('Failed to update payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Cancel a payment plan directly on Flutterwave
  async removePaymentPlan(planId: number): Promise<any> {
    try {
      const response = await axios.put(`${this.flutterwaveUrl}/${planId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
      });
      return { message: 'Payment plan cancelled successfully', data: response.data };
    } catch (error) {
      throw new HttpException(error?.response?.data?.message || 'Failed to cancel payment plan', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
