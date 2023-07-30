import { ApiProperty } from "@nestjs/swagger";
import { EGender, EenumurationType } from "@prisma/client";
import {
  IsEnum,
  IsISO31661Alpha2,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  @IsOptional()
  employeeIdentifier?: string;
  @IsString()
  fullName: string;
  @IsString()
  familyName: string;
  @IsString()
  RssbCode: string;
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
  employeeContactPhone: string;
  @IsString()
  countryName: string;
  @IsISO31661Alpha2()
  countryCode: string;
  @IsNumber()
  AccountNumber: number;
  @IsNumber()
  amount: number;
  @IsString()
  from: Date;
  @IsString()
  to: Date;
  @IsEnum(EenumurationType)
  @ApiProperty({ enum: EenumurationType })
  enumaration: EenumurationType;
  @IsString()
  positionId: string;
}
