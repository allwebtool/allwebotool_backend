import { Module } from '@nestjs/common';
import { TtsvoicescloneService } from './ttsvoicesclone.service';
import { TtsvoicescloneController } from './ttsvoicesclone.controller';
import { DigitalOceanService } from 'src/digitalocean/digitalocean.service';
import { BillingService } from 'src/billing/billing.service';

@Module({
  controllers: [TtsvoicescloneController],
  providers: [TtsvoicescloneService, DigitalOceanService, BillingService],
})
export class TtsvoicescloneModule {}
