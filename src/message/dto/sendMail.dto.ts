import { ApiPropertyOptional } from "@nestjs/swagger";
import { ERole, Emessage } from "@prisma/client";
import { IsArray, IsOptional, IsString } from "class-validator";
export class sendMailDto {
  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ enum: ERole, isArray: true })
  // @IsEnum(ERole, { each: true })
  to?: ERole[];
  @IsOptional()
  @ApiPropertyOptional({ enum: Emessage, isArray: true })
  // @IsEnum(Emessage, { each: true })
  messageType?: Emessage[];
  @IsOptional()
  schoolId?: string;
  @IsString()
  content: string;
  @IsString()
  subject: string;
  @IsOptional()
  @ApiPropertyOptional({ isArray: true })
  streamIds?: string[];
  @IsOptional()
  email?: string;
  @IsOptional()
  phone?: string;
}
