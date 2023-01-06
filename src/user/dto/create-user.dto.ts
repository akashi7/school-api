import { IsPhoneNumber, IsString, Length } from "class-validator";

export abstract class CreateUserDto {
  @IsString()
  username: string;
  @IsString()
  names: string;
}
export class CreateStudentDto extends CreateUserDto {
  @IsString()
  studentId?: string; // Custom student id (student number)
  @IsString()
  schoolId: string;
  @IsString()
  parentId: string;
  @IsString()
  academicYear: string;
}

export class CreateSchoolDto extends CreateUserDto {
  @IsPhoneNumber("RW")
  phone: string;
  @IsString()
  @Length(6)
  password: string;
  @IsString()
  schoolTitle: string;
}

export class CreateParentDto extends CreateUserDto {
  @IsPhoneNumber("RW")
  phone: string;
}
