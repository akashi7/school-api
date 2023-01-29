import { PartialType } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { CreateStudentDto } from "./create-student.dto";

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @Exclude()
  academicYearId: string;
  @Exclude()
  streamId: string;
}
