import {
  IsEnum,
  IsISO31661Alpha2,
  IsNumber,
  IsPhoneNumber,
  IsString,
} from "class-validator";

export enum PaymentMethod {
  AIRTEL = "AIRTEL",
  STRIPE = "STRIPE",
}

export class CreatePaymentDto {
  //   @IsEnum(PaymentMethod)
  //   method: PaymentMethod;
  @IsNumber()
  amount: number;
  @IsString()
  description: string;
  @IsString()
  currency: string;
  @IsISO31661Alpha2()
  country: string;
  @IsPhoneNumber()
  phone: string;
}
