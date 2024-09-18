import { Module } from '@nestjs/common';
import { ImageeditorService } from './imageeditor.service';
import { ImageeditorController } from './imageeditor.controller';

@Module({
  controllers: [ImageeditorController],
  providers: [ImageeditorService],
})
export class ImageeditorModule {}
