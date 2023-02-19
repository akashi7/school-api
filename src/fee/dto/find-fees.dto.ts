import { ApiProperty } from "@nestjs/swagger";
import { EAcademicTerm, EFeeType } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";
import { OptionalProperty } from "../../__shared__/decorators";
import { EFeeStatus } from "../enums/fee-status.enum";

export class FindFeesByStudentDto {
  @ApiProperty()
  @IsString()
  academicYearId: string;
  @ApiProperty({ enum: EAcademicTerm })
  @IsEnum(EAcademicTerm)
  academicTerm: EAcademicTerm;
  @ApiProperty({ enum: EFeeStatus })
  @IsEnum(EFeeStatus)
  status: EFeeStatus;
}

export class FindFeesDto {
  @OptionalProperty()
  search?: string;
  @OptionalProperty({ enum: EFeeType })
  @IsEnum(EFeeType)
  type?: EFeeType;
  @OptionalProperty()
  classroomId?: string;
  @OptionalProperty({ enum: EAcademicTerm })
  term?: EAcademicTerm;
  @OptionalProperty()
  academicYearId?: string;
}
