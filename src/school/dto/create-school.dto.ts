import { ApiProperty } from "@nestjs/swagger";
import { ESchoolType } from "@prisma/client";
import { IsBoolean, IsEnum, IsISO31661Alpha2, IsString } from "class-validator";

export class CreateSchoolDto {
  @IsString()
  schoolName: string;
  @IsString()
  schoolTitle: string;
  @IsString()
  schoolLogo: string;
  @ApiProperty({ enum: ESchoolType })
  @IsEnum(ESchoolType)
  schoolType: ESchoolType;
  @IsBoolean()
  hasStudentIds: boolean;
  @IsString()
  username: string;
  @IsString()
  password: string;
  @IsString()
  countryName: string;
  @IsISO31661Alpha2()
  countryCode: string;
  @IsString()
  address: string;
}
