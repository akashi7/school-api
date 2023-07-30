import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EAcademicTerm } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { InstallmentArrayDto } from "./installment.dto";
export class createInstallmentDto {
  @IsNumber()
  @IsOptional()
  installmentNumber: number;
  @IsString()
  @IsOptional()
  feeId: string;
  @IsString()
  @IsOptional()
  studentId: string;
  @IsEnum(EAcademicTerm)
  @ApiPropertyOptional({ enum: EAcademicTerm })
  academicTerm: EAcademicTerm;
  @IsString()
  @IsOptional()
  reason: string;
  @IsArray()
  @ApiProperty({ isArray: true, type: InstallmentArrayDto })
  installments: InstallmentArrayDto[];
}
