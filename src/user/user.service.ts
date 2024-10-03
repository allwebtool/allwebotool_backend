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

  async findAll(req: Request) {
    const { skip = 0, limit = 10 } = req.query;
  
    const users = await this.prisma.user.findMany({
      skip: Number(skip),
      take: Number(limit),
      include: {
        transactions: true, // Include the transactions related to each user
      },
    });
  
    // Transform user data to calculate totalCredit, totalDebit, and remainingCredit for each user
    const transformedUsers = users.map(user => {
      // Filter transactions based on type and status
      const totalCredit = user.transactions
        .filter(transaction => transaction.type === 'credit' && transaction.status === 'successful')
        .reduce((acc, transaction) => acc + transaction.points, 0);
  
      const totalDebit = user.transactions
        .filter(transaction => transaction.type === 'debit' && transaction.status === 'successful')
        .reduce((acc, transaction) => acc + transaction.points, 0);
  
      // Calculate remaining credit (balance)
      const remainingCredit = totalCredit - totalDebit;
  
      // Exclude `cardToken` (if present) and return the result
      const { cardToken, ...userWithoutCardToken } = user;
  
      return {
        ...userWithoutCardToken,
        totalCredit: Math.floor(totalCredit),
        totalDebit: Math.floor(totalDebit),
        remainingCredit: Math.floor(remainingCredit),
      };
    });
  
    return transformedUsers;
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
      .reduce((acc, transaction) => acc + transaction.points, 0);
    
    const totalDebit = user.transactions
      .filter(transaction => transaction.type === 'debit' && transaction.status === 'successful')
      .reduce((acc, transaction) => acc + transaction.points, 0);
    
    // Calculate remaining credit (balance)
    const remainingCredit = totalCredit - totalDebit;
    
    // Exclude `cardToken` (if present) and return the result
    const { cardToken, ...userWithoutCardToken } = user;
    
    return {
      ...userWithoutCardToken,
      totalCredit: Math.floor(totalCredit),
      totalDebit: Math.floor(totalCredit),
      remainingCredit: Math.floor(remainingCredit),
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
