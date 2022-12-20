import { SetMetadata } from "@nestjs/common";
import { ERole } from "@prisma/client";

export const ROLES_KEY = "roles";
export const AllowRoles = (...roles: ERole[]) => SetMetadata("roles", roles);
