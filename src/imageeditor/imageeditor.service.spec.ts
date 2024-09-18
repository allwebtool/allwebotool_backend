import { Test, TestingModule } from '@nestjs/testing';
import { ImageeditorService } from './imageeditor.service';

describe('ImageeditorService', () => {
  let service: ImageeditorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageeditorService],
    }).compile();

    service = module.get<ImageeditorService>(ImageeditorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
