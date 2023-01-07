import { IsBoolean, IsString } from "class-validator";

export class CreateAcademicYearDto {
  @IsString()
  name: string;
  @IsBoolean()
  current?: boolean = false;
}
