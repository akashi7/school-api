import { IsPhoneNumber } from "class-validator";

export class CreateParentDto {
  @IsPhoneNumber("RW")
  phone: string;
}
