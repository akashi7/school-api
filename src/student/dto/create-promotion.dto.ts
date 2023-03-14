import { IsArray, IsString } from "class-validator";

export class CreatePromotionDto {
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
  @IsString()
  academicYearId: string;
  @IsString()
  streamId: string;
}
