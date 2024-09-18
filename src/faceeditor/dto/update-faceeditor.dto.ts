import { PartialType } from '@nestjs/mapped-types';
import { CreateFaceeditorDto } from './create-faceeditor.dto';

export class UpdateFaceeditorDto extends PartialType(CreateFaceeditorDto) {}
