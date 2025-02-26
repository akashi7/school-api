import { Module } from "@nestjs/common";
import { AcademicYearService } from "./academic-year.service";
import { AcademicYearController } from "./academic-year.controller";

@Module({
  controllers: [AcademicYearController],
  providers: [AcademicYearService],
})
export class AcademicYearModule {}
