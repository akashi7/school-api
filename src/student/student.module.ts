import { Module } from "@nestjs/common";
import { ClassroomService } from "../classroom/classroom.service";
import { FeeModule } from "../fee/fee.module";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [FeeModule, PaymentModule],
  controllers: [StudentController],
  providers: [StudentService, ClassroomService],
})
export class StudentModule {}
