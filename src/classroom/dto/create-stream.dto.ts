import { IsString } from "class-validator";

export class CreateStreamDto {
  @IsString()
  name: string;
}
