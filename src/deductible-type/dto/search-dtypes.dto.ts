import { Edeductible, EenumurationType } from "@prisma/client";
import { OptionalProperty } from "../../__shared__/decorators";

export class FindDeductiblesTypesDto {
  @OptionalProperty()
  search?: string;
  @OptionalProperty()
  type?: Edeductible;
  @OptionalProperty()
  enumaration?: EenumurationType;
}
