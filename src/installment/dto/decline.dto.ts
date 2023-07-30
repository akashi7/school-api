import { EStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { OptionalProperty } from "../../__shared__/decorators";

export class DeclineOrApproveInstallmentDto {
  @OptionalProperty()
  response?: string;
  @OptionalProperty()
  id: string;
  @IsEnum(EStatus)
  status: EStatus;
}
