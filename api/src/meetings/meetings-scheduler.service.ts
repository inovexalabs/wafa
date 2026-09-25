import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MeetingsService } from './meetings.service';

@Injectable()
export class MeetingsSchedulerService {
  private readonly logger = new Logger(MeetingsSchedulerService.name);

  constructor(private readonly meetings: MeetingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDueMeetings() {
    try {
      await this.meetings.notifyDueMeetings();
    } catch (error) {
      this.logger.error(
        'Failed to sweep due meetings for join-link notifications.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
