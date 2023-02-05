import { ApiProperty } from "@nestjs/swagger";
import { EAcademicTerm } from "@prisma/client";
import { FindFeesDto } from "./find-fees.dto";

export class DownloadFeesByClassroomsDto extends FindFeesDto {
  @ApiProperty({ required: true })
  academicYearId: string;
  @ApiProperty({ required: true })
  term: EAcademicTerm;
}
export class DownloadFeesByStudentsDto extends FindFeesDto {
  @ApiProperty({ required: true })
  streamId: string;
  @ApiProperty({ required: true })
  academicYearId: string;
}
