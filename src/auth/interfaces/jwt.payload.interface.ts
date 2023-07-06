import { ERole } from "@prisma/client";

export interface JwtPayload {
  id: string;
  role: ERole;
  countryName: string;
  schoolId?: string;
}
