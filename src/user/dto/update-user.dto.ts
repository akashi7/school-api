import { PartialType } from "@nestjs/swagger";
import { CreateStudentDto } from "./create-user.dto";

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
