import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImageeditorService } from './imageeditor.service';
import { CreateImageeditorDto } from './dto/create-imageeditor.dto';
import { UpdateImageeditorDto } from './dto/update-imageeditor.dto';

@Controller('imageeditor')
export class ImageeditorController {
  constructor(private readonly imageeditorService: ImageeditorService) {}

  @Post()
  create(@Body() createImageeditorDto: CreateImageeditorDto) {
    return this.imageeditorService.create(createImageeditorDto);
  }

  @Get()
  findAll() {
    return this.imageeditorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imageeditorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImageeditorDto: UpdateImageeditorDto) {
    return this.imageeditorService.update(+id, updateImageeditorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imageeditorService.remove(+id);
  }
}
