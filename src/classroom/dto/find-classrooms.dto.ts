import { IsString } from "class-validator";
import { OptionalProperty } from "../../__shared__/decorators";

export class FindClassroomsDto {
  @IsString()
  @OptionalProperty()
  schoolId?: string;
  @IsString()
  @OptionalProperty()
  search?: string;
}
