import { Injectable } from '@nestjs/common';
import { CreateImageeditorDto } from './dto/create-imageeditor.dto';
import { UpdateImageeditorDto } from './dto/update-imageeditor.dto';

@Injectable()
export class ImageeditorService {
  create(createImageeditorDto: CreateImageeditorDto) {
    return 'This action adds a new imageeditor';
  }

  findAll() {
    return `This action returns all imageeditor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} imageeditor`;
  }

  update(id: number, updateImageeditorDto: UpdateImageeditorDto) {
    return `This action updates a #${id} imageeditor`;
  }

  remove(id: number) {
    return `This action removes a #${id} imageeditor`;
  }
}
