import { ERole } from "@prisma/client";
import { Exclude } from "class-transformer";

export abstract class CreateUserDto {
  @Exclude({ toClassOnly: true })
  role: ERole;
  username: string;
  names: string;
}
export class CreateStudentDto extends CreateUserDto {
  role = ERole.STUDENT;
  regNo: string;
  schoolId: string;
  parentId: string;
  academicYear: string;
}

export class CreateSchoolDto extends CreateUserDto {
  role = ERole.SCHOOL;
  phone: string;
  password: string;
  schoolCode: string;
}

export class CreateParentDto extends CreateUserDto {
  role = ERole.PARENT;
  phone: string;
}
