import { OptionalProperty } from "../../__shared__/decorators";

export class StudentSearchDto {
  @OptionalProperty()
  classroomId: string;
  @OptionalProperty()
  streamId: string;
  @OptionalProperty()
  academicYearId: string;
  @OptionalProperty()
  search: string;
}
