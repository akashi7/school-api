import { ApiProperty } from "@nestjs/swagger";
import { EAcademicTerm, EFeeType } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
} from "class-validator";

export class CreateFeeDto {
  @IsString()
  name: string;
  @IsArray()
  @IsString({ each: true })
  classroomIDs: string[];
  @IsString()
  academicYearId: string;
  @IsArray()
  @ApiProperty({ enum: EAcademicTerm, isArray: true })
  @IsEnum(EAcademicTerm, { each: true })
  academicTerms: EAcademicTerm[];
  @IsEnum(EFeeType)
  type: EFeeType;
  @IsBoolean()
  optional: boolean;
  @IsNumber()
  amount: number;
}
