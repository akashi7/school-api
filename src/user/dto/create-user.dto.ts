import { IsString } from "class-validator";

export abstract class CreateUserDto {
  @IsString()
  username: string;
  @IsString()
  names: string;
}
