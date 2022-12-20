import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { ParentController } from "./parent.controller";
import { ParentService } from "./parent.service";

@Module({
  imports: [UserModule],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
