// subscription.guard.ts
import { Injectable, CanActivate, ExecutionContext, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ENSURE_SUBSCRIPTION_KEY } from 'common/decorator/subscription.decorator';
import { BillingService } from 'src/billing/billing.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
    @Inject(BillingService) private readonly billingService: BillingService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ensureSubscription = this.reflector.getAllAndOverride<boolean>(ENSURE_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ensureSubscription) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user.email; 
    console.log(userId)
    if (!userId){
      throw new HttpException("User not found", HttpStatus.FORBIDDEN)
    }
    try {
      const user = await this.prisma.user.findFirst({where:{email: userId}})
      console.log(user)
      const isSubscribed = await this.billingService.checkSubscriptionStatus(userId);

      if (!isSubscribed) {
        throw new HttpException('User is not subscribed', HttpStatus.FORBIDDEN);
      }

      return true;
    } catch (error) {
      console.log(error.status, "here")
      throw new HttpException('Failed to check subscription status', error.status === 403 ? HttpStatus.NOT_ACCEPTABLE : error.status);
    }
  }
}
