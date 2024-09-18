import { PartialType } from '@nestjs/mapped-types';
import { CreateImageeditorDto } from './create-imageeditor.dto';

export class UpdateImageeditorDto extends PartialType(CreateImageeditorDto) {}
