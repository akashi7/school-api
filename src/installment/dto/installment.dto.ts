import { IsDate, IsNumber, IsOptional } from "class-validator";

export class InstallmentArrayDto {
  @IsNumber()
  @IsOptional()
  amount: number;
  @IsDate()
  @IsOptional()
  date: Date;
}
