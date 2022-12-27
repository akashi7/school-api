import { IsNumberString, IsOptional, IsString } from "class-validator";

export class StudentSearchDto {
  @IsString()
  @IsOptional()
  school?: string;
  @IsString()
  @IsOptional()
  academicYear?: string;
  @IsString()
  @IsOptional()
  name?: string;
}
