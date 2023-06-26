import { EDeductibleType, EenumurationType } from "@prisma/client";
import { OptionalProperty } from "../../__shared__/decorators";

export class FindDeductiblesDto {
  @OptionalProperty()
  search?: string;
  @OptionalProperty()
  type?: EDeductibleType;
  @OptionalProperty()
  enumaration?: EenumurationType;
}
