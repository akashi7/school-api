import { Module } from "@nestjs/common";
import { PaymentModule } from "../payment/payment.module";
import { FeeController } from "./fee.controller";
import { FeeService } from "./fee.service";

@Module({
  imports: [PaymentModule],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
