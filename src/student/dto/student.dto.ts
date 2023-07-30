import { IsString } from "class-validator";

export class StudentPromotionDto {
  @IsString()
  studentId: string;
  @IsString()
  academicYearId: string;
  @IsString()
  streamId: string;
}
