import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly flutterwaveUrl: string;
  private readonly flutterwaveSecret: string;
  private readonly valuePerPoint:number;

  constructor(private readonly prisma: PrismaService) {
    this.flutterwaveUrl = process.env.FLUTTERWAVE_URL;
    this.flutterwaveSecret = process.env.FLW_KEY;
    this.valuePerPoint = 0.5
  }
  
  async initializePayment(email: string, amount: number, phone_number: string, name: string, userId:string): Promise<any> {
    try {
      const response = await axios.post(
        this.flutterwaveUrl+'/payments',
        {
          tx_ref: `omashu-${Date.now()}`,
          amount: amount,
          currency: 'USD',
          redirect_url: `${process.env.BASE_URL}/payment/callback`,
          payment_options: 'card',
          customer: {
            email: email,
            phonenumber: phone_number,
            name: name,
          },
          customizations: {
            title: 'Allwebtool Points Purchase',
            description: 'Purchase points to use on Allwebtool platform',
            logo: 'https://cdn.allwebtool.com/allwebtool_assets/logo.png',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const points = amount/this.valuePerPoint

      await this.prisma.transaction.create({data:{
        userId,
        refId: response.data.refId,
        points,
        amount: amount,       
        type: "credit",
        status: "initiated"
      }})
      return response.data;
    } catch (error) {
      throw new HttpException(error.response.data, error.response.status);
    }
  }

  async verifyPayment(transactionId: string, userEmail:string): Promise<any> {
    try {
      const response = await axios.get(
        this.flutterwaveUrl+`/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const resp = response?.data?.data
      await this.prisma.transaction.updateMany({where:{refId: transactionId}, data:{status: "successful"}})
      await this.prisma.user.updateMany({where:{email: userEmail}, data:{cardToken: resp.card?.token, lastDigit:resp.card.last_4digits }})
      return response.data;
    } catch (error) {
      await this.prisma.transaction.updateMany({where:{refId: transactionId}, data:{status: "failed"}})
      throw new HttpException(error.response.data, error.response.status);
    }
  }

}
