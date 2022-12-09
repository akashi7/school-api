import { SetMetadata } from '@nestjs/common';
import { ERole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Role = (...roles: ERole[]) => SetMetadata('roles', roles);
