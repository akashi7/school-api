import { Module } from '@nestjs/common';
import { RelativeService } from './relative.service';
import { RelativeController } from './relative.controller';

@Module({
  providers: [RelativeService],
  controllers: [RelativeController]
})
export class RelativeModule {}
