import { Prisma } from "@prisma/client";

export const studentFields: Prisma.UserSelect = {
  id: true,
  studentIdentifier: true,
  fullName: true,
  email: true,
  passportPhoto: true,
  dob: true,
  gender: true,
  firstContactPhone: true,
  secondContactPhone: true,
  academicTerm: true,
  address: true,
  countryName: true,
  countryCode: true,
};
