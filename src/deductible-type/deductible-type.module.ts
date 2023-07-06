import { Module } from "@nestjs/common";
import { DeductibleTypeController } from "./deductible-type.controller";
import { DeductibleTypeService } from "./deductible-type.service";

@Module({
  controllers: [DeductibleTypeController],
  providers: [DeductibleTypeService],
})
export class DeductibleTypeModule {}
