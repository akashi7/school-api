import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { MessageController } from "./message.controller";
import { MessageService } from "./message.service";

@Global()
@Module({
  imports: [HttpModule],
  providers: [MessageService],
  exports: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
