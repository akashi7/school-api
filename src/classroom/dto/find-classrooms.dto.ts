import { IsOptional, IsString } from "class-validator";

export class FindClassroomsDto {
  @IsString()
  @IsOptional()
  schoolId?: string;
  @IsString()
  @IsOptional()
  search?: string;
}
