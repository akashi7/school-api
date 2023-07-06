import { IsISO31661Alpha2, IsString } from "class-validator";

export class AdminLoginDto {
  @IsString()
  email: string;
  @IsString()
  password: string;
}
export class StudentLoginDto {
  @IsISO31661Alpha2()
  countryCode: string;
  @IsString()
  studentIdentifier: string;
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

export class EmployeeLoginDto {
  @IsISO31661Alpha2()
  countryCode: string;
  @IsString()
  employeeIdentifier: string;
}
