import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';

@Injectable()
export class BillingService {
  private readonly flutterwaveUrl: string;
  private readonly flutterwaveSecret: string;

  constructor() {
    this.flutterwaveUrl = process.env.FLUTTERWAVE_URL;
    this.flutterwaveSecret = process.env.FLW_KEY;
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


  
}
