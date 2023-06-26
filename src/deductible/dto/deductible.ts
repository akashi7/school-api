import { ApiProperty } from "@nestjs/swagger";
import { EDeductibleType } from "@prisma/client";
import { IsEnum, IsNumber } from "class-validator";

export class DeductibleArrayDto {
  @IsEnum(EDeductibleType)
  @ApiProperty({ enum: EDeductibleType })
  type: EDeductibleType;
  @IsNumber()
  amount: number;
}
