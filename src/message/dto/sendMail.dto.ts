import { ApiProperty } from "@nestjs/swagger";
import { ERole, Emessage } from "@prisma/client";
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
export class sendMailDto {
  @IsArray()
  @ApiProperty({ enum: ERole, isArray: true })
  @IsEnum(ERole, { each: true })
  to: ERole[];
  @ApiProperty({ enum: Emessage, isArray: true })
  @IsEnum(Emessage, { each: true })
  messageType: Emessage[];
  @IsOptional()
  schoolId?: string;
  @IsString()
  content: string;
  @IsString()
  subject: string;
}
