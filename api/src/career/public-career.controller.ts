import { Controller, Get } from '@nestjs/common';
import { CareerService } from './career.service';

@Controller('public/career')
export class PublicCareerController {
  constructor(private readonly career: CareerService) {}

  @Get()
  list() {
    return this.career.listOpen();
  }
}
