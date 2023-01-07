import { IsPhoneNumber, IsString } from "class-validator";

export abstract class CreateUserDto {
  @IsString()
  username: string;
  @IsString()
  names: string;
}
export class CreateParentDto extends CreateUserDto {
  @IsPhoneNumber("RW")
  phone: string;
}
