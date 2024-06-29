import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CollectCardPaymentDto } from './dto/collect-card.dto';
import { Request } from 'express';

@Injectable()
export class BillingService {
  private readonly flutterwaveUrl: string;
  private readonly flutterwaveSecret: string;

  constructor() {
    this.flutterwaveUrl = process.env.FLUTTERWAVE_URL;
    this.flutterwaveSecret = process.env.FLW_KEY;
  }

  async create(createBillingDto: CreateBillingDto) {
    try {
      // Create subscription in Flutterwave
      const response = await axios.post(
        `${this.flutterwaveUrl}/subscriptions`,
        createBillingDto,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data?.message || 'Error creating subscription', HttpStatus.BAD_REQUEST);
    }
  }

  async createSub(paymentData: CollectCardPaymentDto) {
    try {
      const subscriptionDetails = {
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        currency: "NGN",
        customer: {
          email: paymentData.email,
        },
        plan: paymentData.payment_plan,
      };
  
      try {
        const response = await axios.post(
          `${this.flutterwaveUrl}/subscriptions`,
          subscriptionDetails,
          {
            headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
          },
        );
        return response.data;
      } catch (error) {
        throw new HttpException(
          error.response?.data?.message || 'Error creating subscription',
          HttpStatus.BAD_REQUEST,
        );
      }
    }catch(e){
      
    }
  }

  async findAll() {
    try {
      const response = await axios.get(
        `${this.flutterwaveUrl}/subscriptions`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );
      return response.data.data;
    } catch (error) {
      throw new HttpException(error.response?.data?.message || 'Error fetching subscriptions', HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(req: Request) {
    try {
      const user: any = req.user;
      const response = await axios.get(
        `${this.flutterwaveUrl}/subscriptions`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
          params: { email: user.email },
        },
      );

      const subscription = response.data.data
      if (!subscription) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }
      return subscription;
    } catch (error) {
      throw new HttpException(error.response?.data?.message || 'Error fetching subscription', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: number, updateBillingDto: UpdateBillingDto) {
    try {
      // Update subscription in Flutterwave
      const response = await axios.patch(
        `${this.flutterwaveUrl}/subscriptions/${id}`,
        updateBillingDto,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data?.message || 'Error updating subscription', HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: number) {
    try {
      // Delete subscription in Flutterwave
      const response = await axios.delete(
        `${this.flutterwaveUrl}/subscriptions/${id}`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );

      return { message: 'Subscription deleted successfully', data: response.data };
    } catch (error) {
      throw new HttpException(error.response?.data?.message || 'Error deleting subscription', HttpStatus.BAD_REQUEST);
    }
  }

  async checkSubscriptionStatus(req: Request) {
    try {
      const user: any = req.user;
      const response = await axios.get(
        `${this.flutterwaveUrl}/subscriptions`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
          params: { email: user.email },
        },
      );

      const subscription = response.data.data[0];
      return subscription.status === 'active' ? { status: 200 } : { status: 400 };
    } catch (error) {
      console.log(error);
      throw new HttpException('Failed to check subscription status', HttpStatus.BAD_REQUEST);
    }
  }
}
