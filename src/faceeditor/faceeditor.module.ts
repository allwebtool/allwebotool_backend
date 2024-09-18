import { Module } from '@nestjs/common';
import { FaceEditorService } from './faceeditor.service';
import { FaceEditorController } from './faceeditor.controller';
import { DigitalOceanService } from 'src/digitalocean/digitalocean.service';

@Module({
  controllers: [FaceEditorController],
  providers: [FaceEditorService, DigitalOceanService],
})
export class FaceeditorModule {}
