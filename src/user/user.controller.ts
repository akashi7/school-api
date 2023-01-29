import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole } from "@prisma/client";
import { Auth } from "../auth/decorators/auth.decorator";
import { UserService } from "./user.service";

@Controller("users")
@Auth(ERole.ADMIN)
@ApiTags("Users")
export class UserController {
  constructor(private readonly userService: UserService) {}
}
