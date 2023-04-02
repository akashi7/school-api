import { ApiProperty } from "@nestjs/swagger";
import { EAcademicTerm, EPaymentMethod } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsISO31661Alpha2,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  ValidateIf,
} from "class-validator";

export class PayFeeDto {
  @IsNumber()
  @IsPositive()
  amount: number;
  @IsOptional()
  referenceCode?: string;
  @IsOptional()
  @IsEnum(EPaymentMethod)
  @ApiProperty({ enum: EPaymentMethod })
  paymentMethod: EPaymentMethod;
  @IsDateString()
  date: Date;
  @IsPhoneNumber()
  phoneNumber?: string;
  @IsString()
  description: string;
  @IsString()
  academicYearId?: string;
  @IsEnum(EAcademicTerm)
  @ApiProperty({ enum: EAcademicTerm })
  academicTerm?: EAcademicTerm;
}

export class PayFeeWithThirdPartyDto extends PayFeeDto {
  @IsEnum(EPaymentMethod)
  @ApiProperty({ enum: EPaymentMethod })
  paymentMethod: EPaymentMethod;
  @IsString()
  currency: string;
  @IsISO31661Alpha2()
  @ValidateIf((o) => o.method === EPaymentMethod.MPESA)
  country?: string;
}
