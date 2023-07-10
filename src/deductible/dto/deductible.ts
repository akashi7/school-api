// import { EDeductibleType } from "@prisma/client";
import { IsNumber } from "class-validator";

export class DeductibleArrayDto {
  // @IsEnum(EDeductibleType)
  // @ApiProperty({ enum: EDeductibleType })
  // type: EDeductibleType;
  @IsNumber()
  amount: number;
}
