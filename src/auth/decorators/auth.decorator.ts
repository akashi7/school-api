import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiCookieAuth } from "@nestjs/swagger";
import { ERole } from "@prisma/client";
import { JwtGuard } from "../guards/jwt.guard";
import { RolesGuard } from "../guards/roles.guard";
import { AllowRoles } from "./roles.decorator";

export function Auth(...roles: ERole[]) {
  return applyDecorators(
    ApiCookieAuth(),
    UseGuards(JwtGuard, RolesGuard),
    AllowRoles(...roles),
  );
}
