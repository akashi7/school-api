import { Prisma } from "@prisma/client";

export const employeeFields: Prisma.UserSelect = {
  id: true,
  employeeIdentifier: true,
  employeeFullName: true,
  employeeEmail: true,
  employeePassportPhoto: true,
  employeeDob: true,
  employeeGender: true,
  employeeContactPhone: true,
  address: true,
  countryName: true,
  countryCode: true,
  AccountNumber: true,
  position: true,
};
