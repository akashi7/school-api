import { EenumurationType, EpostionsType } from "@prisma/client";
import { OptionalProperty } from "../../__shared__/decorators";

export class EmployeeSearchDto {
  @OptionalProperty()
  search: string;
  @OptionalProperty()
  emunaration: EenumurationType;
  @OptionalProperty()
  current: boolean;
  @OptionalProperty()
  position: EpostionsType;
}
