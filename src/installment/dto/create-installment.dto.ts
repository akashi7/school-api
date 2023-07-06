import { IsNumber, IsString } from "class-validator";
export class createInstallmentDto {
  @IsNumber()
  installmentNumber: number;
  @IsString()
  feeId: string;
}
