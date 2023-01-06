import { PartialType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateStreamDto } from "./create-stream.dto";

export class UpdateStreamDto extends PartialType(CreateStreamDto) {
  @IsString()
  @IsOptional()
  classroomId: string;
}
