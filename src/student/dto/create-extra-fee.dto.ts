import { IsString } from "class-validator";

export class CreateExtraFeeDto {
  @IsString()
  feeId: string;
}
