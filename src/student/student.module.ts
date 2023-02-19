import { Module } from "@nestjs/common";
import { ClassroomService } from "../classroom/classroom.service";
import { FeeService } from "../fee/fee.service";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";

@Module({
  controllers: [StudentController],
  providers: [StudentService, ClassroomService, FeeService],
})
export class StudentModule {}
