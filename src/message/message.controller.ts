import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import {
  CreatedResponse,
  PageResponse,
  Paginated,
  PaginationParams,
} from "src/__shared__/decorators";
import { GenericResponse } from "src/__shared__/dto/generic-response.dto";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { sendMailDto } from "./dto/sendMail.dto";
import { MessageService } from "./message.service";

@Controller("message")
@ApiTags("messages")
export class MessageController {
  constructor(private readonly message: MessageService) {}

  @Post()
  @Auth(ERole.ADMIN, ERole.SCHOOL)
  @CreatedResponse()
  async sendMail(@Body() dto: sendMailDto, @GetUser() user: User) {
    const payload = await this.message.SendMail(dto, user);
    return new GenericResponse("Message  sent !", payload);
  }
  @Get()
  @Paginated()
  @PageResponse()
  @Auth(ERole.SCHOOL, ERole.ADMIN)
  async getEmployees(
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.message.getAllMessages(user, options);
    return new GenericResponse("Notification retrieved", payload);
  }
}
