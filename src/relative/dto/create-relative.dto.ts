import { IsEmail, IsOptional, IsPhoneNumber } from "class-validator";

export class CreateRelativeDto {
  @IsOptional()
  fullName: string;
  @IsPhoneNumber("RW")
  phone: string;
  @IsEmail()
  email: string;
}
