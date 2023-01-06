import { IsString } from "class-validator";

export class CreateClassroomDto {
  @IsString()
  name: string;
}
