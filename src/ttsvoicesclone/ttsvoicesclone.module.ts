import { Module } from '@nestjs/common';
import { TtsvoicescloneService } from './ttsvoicesclone.service';
import { TtsvoicescloneController } from './ttsvoicesclone.controller';
import { DigitalOceanModule } from 'src/digitalocean/digitalocean.module';
import { DigitalOceanService } from 'src/digitalocean/digitalocean.service';

@Module({
  controllers: [TtsvoicescloneController],
  providers: [TtsvoicescloneService, DigitalOceanService],
})
export class TtsvoicescloneModule {}
