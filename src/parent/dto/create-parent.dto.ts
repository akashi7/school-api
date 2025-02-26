import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class CreateParentDto {
  @IsString()
  @IsOptional()
  fullName: string;
  @IsPhoneNumber("RW")
  phone: string;
  @IsEmail()
  email: string;
}
