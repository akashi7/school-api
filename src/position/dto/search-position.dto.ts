import { OptionalProperty } from "../../__shared__/decorators";

export class PositionSearchDto {
  @OptionalProperty()
  search: string;
}
