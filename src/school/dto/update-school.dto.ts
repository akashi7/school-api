import { ESchoolType } from "@prisma/client";
import { IsEnum, IsISO31661Alpha2, IsOptional } from "class-validator";
import { OptionalProperty } from "../../__shared__/decorators";

export class UpdateSchoolDto {
  schoolName?: string;
  schoolTitle?: string;
  schoolLogo?: string;
  @OptionalProperty({ enum: ESchoolType })
  @IsEnum(ESchoolType)
  schoolType?: ESchoolType;
  hasStudentIds?: boolean;
  countryName?: string;
  @IsISO31661Alpha2()
  @IsOptional()
  countryCode?: string;
  address?: string;
}
