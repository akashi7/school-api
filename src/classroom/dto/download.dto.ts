import { OptionalProperty } from "../../__shared__/decorators";

export class DownloadClassExcelDto {
  @OptionalProperty()
  id?: string;
  @OptionalProperty()
  academicYearId?: string;
}
