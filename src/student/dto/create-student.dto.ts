import { ApiProperty } from "@nestjs/swagger";
import { EAcademicTerm, EGender } from "@prisma/client";
import {
  IsEnum,
  IsISO31661Alpha2,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from "class-validator";

export class CreateStudentDto {
  @IsString()
  @IsOptional()
  studentIdentifier?: string;
  @IsString()
  fullName: string;
  @IsString()
  email: string;
  @IsString()
  address: string;
  @IsString()
  passportPhoto: string;
  @IsString()
  dob: Date;
  @IsEnum(EGender)
  @ApiProperty({ enum: EGender })
  gender: EGender;
  @IsPhoneNumber("RW")
  firstContactPhone: string;
  @IsPhoneNumber("RW")
  secondContactPhone: string;
  @IsPhoneNumber("RW")
  parentPhoneNumber: string;
  @IsEnum(EAcademicTerm)
  @ApiProperty({ enum: EAcademicTerm })
  academicTerm: EAcademicTerm;
  @IsString()
  countryName: string;
  @IsISO31661Alpha2()
  countryCode: string;
  @IsString()
  academicYearId: string;
  @IsString()
  streamId: string;
}
