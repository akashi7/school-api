import { IsISO31661Alpha2, IsOptional, IsString } from "class-validator";

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

export class GoogleLoginDto {
  @IsString()
  token: string;
  @IsString()
  url?: string;
  @IsString()
  @IsOptional()
  role: string;
}

export class GoogleSignupDto {
  @IsString()
  token: string;
}

export class ResetPasswordDto {
  @IsString()
  email: string;
}

export class CheckCodeDto {
  @IsString()
  code: string;
  @IsString()
  userId: string;
}

export class ChangePasswordDto {
  @IsString()
  password: string;
  @IsString()
  userId: string;
}
