import { PartialType } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { IsString } from "class-validator";
import { CreateFeeDto } from "./create-fee.dto";

export class UpdateFeeDto extends PartialType(CreateFeeDto) {
  @Exclude()
  classroomIDs?: string[];
  @IsString()
  classroomId?: string;
}
