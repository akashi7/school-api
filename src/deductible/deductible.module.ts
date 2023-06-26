import { Module } from "@nestjs/common";
import { DeductibleController } from "./deductible.controller";
import { DeductibleService } from "./deductible.service";

@Module({
  controllers: [DeductibleController],
  providers: [DeductibleService],
})
export class DeductibleModule {}
