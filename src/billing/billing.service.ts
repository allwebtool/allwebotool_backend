import { Injectable, HttpException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

type VerifyPaymentDto = {
  email: string;
  tx_ref: string;
  transaction_id: string;
  status: string;
};

@Injectable()
export class BillingService {
  private readonly flutterwaveUrl: string;
  private readonly flutterwaveSecret: string;
  private readonly valuePerPoint:number;

  constructor(private readonly prisma: PrismaService) {
    this.flutterwaveUrl = process.env.FLUTTERWAVE_URL;
    this.flutterwaveSecret = process.env.FLW_KEY;
    this.valuePerPoint = 45
  }
  
  async initializePayment(uremail:string, amount: number): Promise<any> {
    try {
      const points = amount/this.valuePerPoint

      const user = await this.prisma.user.findFirst({where:{email: uremail}})
      const token = user.cardToken
      if (token){
        const res = await this.autoBill(token,user.email, amount)
        console.log(res.data)
        await this.prisma.transaction.create({data:{
          userId: user.id,
          refId: res.data.tx_ref,
          points,
          amount: amount,       
          type: "credit",
          status: "successful"
        }})
        
        return {url: "/billing/verify?autobill=true"}
      }
      const tx_ref =  `allwebtool-${randomUUID()+Date.now()}`

      const response = await axios.post(
        this.flutterwaveUrl+'/payments',
        {
          tx_ref,
          amount: amount,
          currency: 'NGN',
          redirect_url: `https://allwebtool.com/billing/verify`,
          // payment_options: 'card',
          customer: {
            email: user.email,
            name: user.username
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
      console.log(response.data)

      await this.prisma.transaction.create({data:{
        refId: tx_ref,
        userId: user.id,
        points,
        amount: amount,       
        type: "credit",
        status: "initiated"
      }})
        return {url: response.data.data.link}
        
    } catch (error) {
      console.log(error)
      throw new HttpException(error.response.data, error.response.status);
    }
  }

  async verifyPayment(details: VerifyPaymentDto): Promise<any> {
      
    const user = await this.prisma.user.findFirst({where:{email: details.email}})
    const trans = await this.prisma.transaction.findFirst({where:{userId: user.id, refId:details.tx_ref, status: "initiated"}})
    if(!trans) return {message: "no longer active"}
    if(details.status !== "successful") return await this.prisma.transaction.update({where:{id: trans.id}, data:{status: "failed"}})
      const newt= await this.prisma.transaction.update({where:{id: trans.id}, data:{status: "successful"}})
      console.log("newt", newt)
    try {
      const response = await axios.get(
        this.flutterwaveUrl+`/transactions/${details.transaction_id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const resp = response?.data?.data
      console.log(resp.data)

      
      await this.prisma.user.update({where:{id: user.id}, data:{cardToken: resp.card?.token, lastDigit:parseInt(resp.card.last_4digits) }})
      return response.data;
    } catch (error) {
      console.log(error)
      await this.prisma.transaction.update({where:{id: trans.id}, data:{status: "failed"}})
      throw new Error(error);
    }
  }

  async autoBill(token: string, email: string, amount: number): Promise<any> {
    const tx_ref = `autobill_${email}_${Date.now()}`
    const data = {
      token,
      currency: 'NGN',
      country: 'NG',
      amount,
      email,
      tx_ref,
      narration: `Allwebtool points charge Billing Charge`,
    };

    try {
      const response = await axios.post(this.flutterwaveUrl+'/tokenized-charges', data, {
        headers: {
          Authorization: `Bearer ${this.flutterwaveSecret}`,
          'Content-Type': 'application/json',
        },
      })

      return response.data;
    } catch (error) {
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  async billAm(userId:string, points: number){
    try{
      console.log("was here")
      const user = await this.prisma.user.findFirst({
        where: { email: userId },
        include: {
          transactions: true, // Include the transactions related to the user
        },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Filter transactions based on type and status
      const totalCredit = user.transactions
        .filter(transaction => transaction.type === 'credit' && transaction.status === 'successful')
        .reduce((acc, transaction) => acc + transaction.points, 0);
      
      const totalDebit = user.transactions
        .filter(transaction => transaction.type === 'debit' && transaction.status === 'successful')
        .reduce((acc, transaction) => acc + transaction.points, 0);
      
      // Calculate remaining credit (balance)
      const remainingCredit = totalCredit - totalDebit;
      const  amountTodebit = this.valuePerPoint*points
      
      if((remainingCredit-points) < 0) return "insufficient"
      const re = await this.prisma.transaction.create({data:{
        userId: user.id,
        points,
        amount: amountTodebit,
        type: "debit",
        status: "successful"
      }})
      console.log(re)
      return "successful"
    }
    catch(e:any){
      console.log(e)
    }
  }

  async givePoint(userId:string, points:number){
    try{
      await this.prisma.transaction.create({data:{
        userId,
        points,
        amount: 0,
        type:"credit",
        status:"successful"
      }})

      return {message:"points added successfully"}
    }catch(e){
      throw new Error(`Failed to give points: ${e.message}`);
    }
  }
}
