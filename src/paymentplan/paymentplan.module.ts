import { Module } from '@nestjs/common';
import { PaymentPlanController } from './paymentplan.controller';
import { PaymentPlanService } from './paymentplan.service';

@Module({
  controllers: [PaymentPlanController],
  providers: [PaymentPlanService],
})
export class PaymentplanModule {}
