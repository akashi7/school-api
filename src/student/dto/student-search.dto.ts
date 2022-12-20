import { IsNumberString, IsOptional, IsString } from "class-validator";

export class StudentSearchDto {
  @IsNumberString()
  @IsOptional()
  school?: number;
  @IsString()
  @IsOptional()
  academicYear?: string;
  @IsString()
  @IsOptional()
  name?: string;
}
