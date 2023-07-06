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
  employeeFullName: string;
  @IsString()
  employeeEmail: string;
  @IsString()
  address: string;
  @IsString()
  employeePassportPhoto: string;
  @IsString()
  employeeDob: Date;
  @IsEnum(EGender)
  @ApiProperty({ enum: EGender })
  employeeGender: EGender;
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
