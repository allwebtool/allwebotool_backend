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
      // Step 1: Check for existing active subscriptions
      const existingSubscriptionsResponse = await axios.get(
        `${this.flutterwaveUrl}/subscriptions`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
          params: { email: paymentData.email },
        },
      );
  
      const activeSubscriptions = (existingSubscriptionsResponse?.data?.data ?? [])
        .filter((subscription: any) => subscription.status === 'active');
  
      if (activeSubscriptions.length > 0) {
        throw new HttpException(
          'User already has an active subscription',
          HttpStatus.CONFLICT,
        );
      }
  
      // Step 2: Proceed to create a new subscription if no active subscriptions exist
      const subscriptionDetails = {
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        currency: "NGN",
        customer: {
          email: paymentData.email,
        },
        plan: paymentData.payment_plan,
      };
  
      const response = await axios.post(
        `${this.flutterwaveUrl}/subscriptions`,
        subscriptionDetails,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );
  
      return response.data;
  
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw custom exceptions
      }
      throw new HttpException(
        error.response?.data?.message || 'Error creating subscription',
        HttpStatus.BAD_REQUEST,
      );
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
      const activeSubscriptions = (response?.data?.data ?? [])
      .filter((subscription: any) => subscription.status === 'active')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

   
      if (activeSubscriptions.length > 0) {
        console.log(activeSubscriptions)
        return activeSubscriptions
      } else {
        return { status: 400, message: 'No active subscriptions found' };
      }
    } catch (error) {
      console.log(error.response);
      throw new HttpException('Failed to check subscription status', HttpStatus.BAD_REQUEST);
    }
  }

  async checkCustomerTransactions(req: Request) {
    try {
      const user: any = req.user;
      const response = await axios.get(
        `${this.flutterwaveUrl}/transactions`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
          params: { customer_email: user.email, status: "successful" },
        },
      )
     
      return response?.data?.data
      
    } catch (error) {
      console.log(error.response.data);
      throw new HttpException('Failed to check customer transactions', HttpStatus.BAD_REQUEST);
    }
  }
  
}
