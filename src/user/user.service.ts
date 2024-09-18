// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(req: Request) {
    const usr:any = req.user

    const user = await this.prisma.user.findUnique({
      where: { email: usr.email },
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
      .reduce((acc, transaction) => acc + transaction.amount, 0);
    
    const totalDebit = user.transactions
      .filter(transaction => transaction.type === 'debit' && transaction.status === 'successful')
      .reduce((acc, transaction) => acc + transaction.amount, 0);
    
    // Calculate remaining credit (balance)
    const remainingCredit = totalCredit - totalDebit;
    
    // Exclude `cardToken` (if present) and return the result
    const { cardToken, ...userWithoutCardToken } = user;
    
    return {
      ...userWithoutCardToken,
      totalCredit,
      totalDebit,
      remainingCredit,
    };
  }


  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
