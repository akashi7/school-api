import { Prisma } from "@prisma/client";

export const employeeFields: Prisma.UserSelect = {
  id: true,
  employeeIdentifier: true,
  fullName: true,
  email: true,
  passportPhoto: true,
  dob: true,
  gender: true,
  employeeContactPhone: true,
  address: true,
  countryName: true,
  countryCode: true,
  AccountNumber: true,
  position: true,
};
