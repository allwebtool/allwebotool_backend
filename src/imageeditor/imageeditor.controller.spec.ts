import { Test, TestingModule } from '@nestjs/testing';
import { ImageeditorController } from './imageeditor.controller';
import { ImageeditorService } from './imageeditor.service';

describe('ImageeditorController', () => {
  let controller: ImageeditorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageeditorController],
      providers: [ImageeditorService],
    }).compile();

    controller = module.get<ImageeditorController>(ImageeditorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
