import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { CreateParentDto } from "./dto/create-parent.dto";
import { ParentService } from "./parent.service";

@Controller("parents")
@ApiTags("Parents")
@Auth(ERole.SCHOOL)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}
  @Get()
  async findAll() {
    const payload = await this.parentService.findAll();
    return new GenericResponse("Parents retrieved", payload);
  }

  @Get("children")
  @Auth(ERole.PARENT)
  async getChildren(@GetUser() user: User) {
    const payload = await this.parentService.getChildren(user.id);
    return new GenericResponse("Children retrieved", payload);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const payload = await this.parentService.findOne(id);
    return new GenericResponse("Parent retrieved", payload);
  }

  @Post()
  @Auth(ERole.ADMIN)
  async createParent(@Body() dto: CreateParentDto) {
    const payload = await this.parentService.create(dto);
    return new GenericResponse("Parent created", payload);
  }
}
