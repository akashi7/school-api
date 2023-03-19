import { Module } from "@nestjs/common";
import { PaymentService } from "../payment/payment.service";
import { FeeController } from "./fee.controller";
import { FeeService } from "./fee.service";

@Module({
  controllers: [FeeController],
  providers: [FeeService, PaymentService],
  exports: [FeeService],
})
export class FeeModule {}
