import { OptionalProperty } from "../../__shared__/decorators";

export class FindInstallmentDto {
  @OptionalProperty()
  search?: string;
}
