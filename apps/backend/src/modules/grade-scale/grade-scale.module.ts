import { Module } from '@nestjs/common';
import { GradeScaleService } from './grade-scale.service';
import { GradeScaleResolver } from './grade-scale.resolver';

@Module({
  providers: [GradeScaleService, GradeScaleResolver],
  exports: [GradeScaleService],
})
export class GradeScaleModule {}
