import { IsOptional, IsString } from "class-validator";

export class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  academicYearId?: string;
  @IsString()
  @IsOptional()
  streamId?: string;
}
