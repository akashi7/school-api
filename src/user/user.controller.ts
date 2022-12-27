import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole } from "@prisma/client";
import { Protected } from "../auth/decorators/auth.decorator";
import { UserService } from "./user.service";

@Controller("users")
@Protected(ERole.ADMIN)
@ApiTags("Users")
export class UserController {
  constructor(private readonly userService: UserService) {}
}
