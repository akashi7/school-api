import { IsISO31661Alpha2, IsISO31661Alpha3, IsString } from "class-validator";

export class AdminLoginDto {
  @IsString()
  username: string;
  @IsString()
  password: string;
}
export class StudentLoginDto {
  @IsISO31661Alpha3()
  countryCode: string;
  @IsString()
  regNo: string;
}
export class ParentLoginDto {
  @IsString()
  phone: string;
}
export class SchoolLoginDto {
  @IsISO31661Alpha2()
  countryCode: string;
  @IsString()
  username: string;
  @IsString()
  password: string;
}
