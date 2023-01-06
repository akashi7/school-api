import { IsOptional, IsString } from "class-validator";

export class UpdateClassroomDto {
  @IsString()
  @IsOptional()
  name?: string;
}
