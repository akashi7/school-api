import { ApiProperty } from "@nestjs/swagger";
import { EPaymentMethod } from "@prisma/client";
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
}

export class PayFeeWithThirdPartyDto {
  @IsEnum(EPaymentMethod)
  @ApiProperty({ enum: EPaymentMethod })
  method: EPaymentMethod;
  @IsNumber()
  amount: number;
  @IsString()
  description: string;
  @IsString()
  currency: string;
  @IsISO31661Alpha2()
  @ValidateIf((o) => o.method === EPaymentMethod.MPESA)
  country?: string;
  @IsPhoneNumber()
  phone: string;
}
