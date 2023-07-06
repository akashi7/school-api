import { Module } from "@nestjs/common";
import { InstallmentController } from "./installment.controller";
import { InstallmentService } from "./installment.service";

@Module({
  controllers: [InstallmentController],
  providers: [InstallmentService],
})
export class InstallmentModule {}
