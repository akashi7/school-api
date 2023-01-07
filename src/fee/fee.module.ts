import { Module } from "@nestjs/common";
import { FeeController } from "./fee.controller";
import { FeeService } from "./fee.service";

@Module({
  controllers: [FeeController],
  providers: [FeeService],
})
export class FeeModule {}
