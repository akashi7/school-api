import { IsOptional } from "class-validator";

export class PaginationDto {
  @IsOptional()
  page?: string = "0";
  @IsOptional()
  size?: string = "10";
}
