import { IsString } from "class-validator";
export class createPositionDto {
  @IsString()
  positionName: string;
}
