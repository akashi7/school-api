import { ApiProperty } from "@nestjs/swagger";
import { EenumurationType } from "@prisma/client";
import { IsEnum, IsNumber, IsString } from "class-validator";
// import { DeductibleArrayDto } from "./deductible";

export class CreateDeductibleDto {
  // @IsArray()
  // @ApiProperty({ isArray: true })
  // types: DeductibleArrayDto[];
  @IsString()
  name: string;
  @IsString()
  deductibleId: string;
  @IsNumber()
  amount: number;
  @IsEnum(EenumurationType)
  @ApiProperty({ enum: EenumurationType })
  enumaration: EenumurationType;
}
