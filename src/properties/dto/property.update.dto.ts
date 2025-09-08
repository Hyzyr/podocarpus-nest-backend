import { PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './property.create.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
