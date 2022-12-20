import { Module } from "@nestjs/common";
import { PasswordEncryption } from "../auth/utils/password-encrytion";
import { SchoolController } from "./school.controller";
import { SchoolService } from "./school.service";

@Module({
  controllers: [SchoolController],
  providers: [SchoolService, PasswordEncryption],
})
export class SchoolModule {}
