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
  
      // Fetch subscriptions
      const response = await axios.get(`${this.flutterwaveUrl}/subscriptions`, {
        headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        params: { email: user.email },
      });
  
      const subscriptions = response.data.data;
  
      if (!subscriptions || subscriptions.length === 0) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }
  
      // Fetch plan details for each subscription
      const enrichedSubscriptions = await Promise.all(
        subscriptions.map(async (subscription: any) => {
          try {
            const planResponse = await axios.get(`${this.flutterwaveUrl}/payment-plans/${subscription.plan}`, {
              headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
            });
            return {
              ...subscription,
              plan: planResponse.data.data, // Add plan details to the subscription object
            };
      

          } catch (error) {
            console.error(`Failed to fetch plan for subscription ID: ${subscription.id}`);
            return subscription; // If plan fetch fails, return the subscription without plan details
          }
        })
      );
  
      return enrichedSubscriptions;
    } catch (error) {
      throw new HttpException(error.response?.data?.message || 'Error fetching subscription', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: number) {
    try {
      // Delete subscription in Flutterwave
      const response = await axios.put(
        `${this.flutterwaveUrl}/subscriptions/${id}/cancel`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );

      return { message: 'Subscription deactivated successfully', data: response.data };
    } catch (error) {
      console.log(error)
      throw new HttpException(error.response?.data?.message || 'Error deleting subscription', HttpStatus.BAD_REQUEST);
    }
  }

  async reactivate(id: number) {
    try {
      // Delete subscription in Flutterwave
      const response = await axios.put(
        `${this.flutterwaveUrl}/subscriptions/${id}/activate`,
        {
          headers: { Authorization: `Bearer ${this.flutterwaveSecret}` },
        },
      );

      return { message: 'Subscription deactivated successfully', data: response.data };
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
