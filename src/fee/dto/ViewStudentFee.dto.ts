import { EFeeType } from "@prisma/client";

export class ViewStudentFeeDto {
  id: string;
  createdAt: Date;
  name: string;
  type: EFeeType;
  amount: number;
  paid: number;
  remaining: number;
  optional: boolean;
}
