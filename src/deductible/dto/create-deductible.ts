import { ApiProperty } from "@nestjs/swagger";
import { EenumurationType } from "@prisma/client";
import { IsArray, IsEnum, IsString } from "class-validator";
import { DeductibleArrayDto } from "./deductible";

export class CreateDeductibleDto {
  @IsArray()
  @ApiProperty({ isArray: true })
  types: DeductibleArrayDto[];
  @IsString()
  name: string;
  @IsEnum(EenumurationType)
  @ApiProperty({ enum: EenumurationType })
  enumaration: EenumurationType;
}
