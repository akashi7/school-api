import { ApiProperty } from "@nestjs/swagger";
import { Edeductible, EenumurationType } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsString } from "class-validator";

export class createDeductibleTypesDto {
  @IsString()
  name: string;
  @IsBoolean()
  optional: boolean;
  @IsEnum(Edeductible)
  @ApiProperty({ enum: Edeductible })
  type: Edeductible;
  @IsEnum(EenumurationType)
  @ApiProperty({ enum: EenumurationType })
  enumaration: EenumurationType;
  @IsNumber()
  amount: number;
}
