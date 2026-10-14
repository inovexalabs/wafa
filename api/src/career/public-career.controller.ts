import { Controller, Get } from '@nestjs/common';
import { CareerService } from './career.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('public/career')
export class PublicCareerController {
  constructor(private readonly career: CareerService) {}

  @Get()
  list() {
    return this.career.listOpen();
  }
}
