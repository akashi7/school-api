import { IsString } from "class-validator";

export class CreatePromotionDto {
  @IsString()
  academicYearId: string;
  @IsString()
  streamId: string;
}
