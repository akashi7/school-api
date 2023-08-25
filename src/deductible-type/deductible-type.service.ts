import { ConflictException, Injectable } from "@nestjs/common";
import { DeductibleTypes, Prisma, User } from "@prisma/client";
import { Workbook } from "exceljs";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { PrismaService } from "src/prisma.service";
import { createDeductibleTypesDto } from "./dto/create-dtype.dto";
import { DownloadExcelDto } from "./dto/download.dto";
import { FindDeductiblesTypesDto } from "./dto/search-dtypes.dto";

@Injectable()
export class DeductibleTypeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a deductible-type
   * @param dto create object
   * @param user logged in user
   * @returns deductible-type
   */

  async create(dto: createDeductibleTypesDto, user: User) {
    const existingDeductubleType =
      await this.prismaService.deductibleTypes.findFirst({
        where: {
          schoolId: user.schoolId,
          name: {
            mode: "insensitive",
            contains: dto.name,
          },
        },
      });
    if (existingDeductubleType) {
      throw new ConflictException("Deductible type arleady exists");
    }
    const position = this.prismaService.deductibleTypes.create({
      data: {
        schoolId: user.schoolId,
        ...dto,
      },
    });
    return position;
  }

  /**
   * Find all deductible-types
   * @param param0 pagination options
   * @param findDto find options
   * @param user logged in user
   * @returns deductible-types
   */

  async findAll(
    findDto: FindDeductiblesTypesDto,
    { page, size }: IPagination,
    user: User,
  ) {
    const whereConditions: Prisma.DeductibleTypesWhereInput = {};
    if (findDto.search) {
      whereConditions.name = {
        contains: findDto.search,
        mode: "insensitive",
      };
    }
    if (findDto.enumaration) {
      whereConditions.enumaration = findDto.enumaration;
    }
    if (findDto.type) {
      whereConditions.type = findDto.type;
    }

    const payload = await paginate<
      DeductibleTypes,
      Prisma.DeductibleTypesFindManyArgs
    >(
      this.prismaService.deductibleTypes,
      {
        where: {
          ...whereConditions,
          schoolId: user.schoolId,
        },
        orderBy: { createdAt: "desc" },
      },
      +page,
      +size,
    );
    return payload;
  }

  async downloadDeductibles(user: User, dto?: DownloadExcelDto) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Payroll Report");

    const deductibleTypes = await this.prismaService.deductibleTypes.findMany({
      where: {
        schoolId: user.schoolId,
      },
    });

    const columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NAME", key: "name", width: 20 },
      { header: "ENUMARATION", key: "salaryName", width: 25 },
      { header: "GROSS", key: "amount", width: 10 },
    ];

    for (const deductibleType of deductibleTypes) {
      columns.push({
        header: deductibleType.name || "",
        key: deductibleType.name || "",
        width: 15,
      });
    }

    columns.push({
      header: "TOTAL DEDUCTED",
      key: "deductedAmount",
      width: 25,
    });
    columns.push({ header: "NET", key: "netAmount", width: 10 });

    worksheet.columns = columns;

    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true };

    const employees = await this.prismaService.user.findMany({
      where: {
        schoolId: user.schoolId,
        ...(dto.id && { id: dto.id }),
      },
      include: {
        employeeSalary: true,
      },
    });

    let rowNumber = 2;
    for (const employee of employees) {
      for (const employeeSalary of employee.employeeSalary) {
        const row = worksheet.addRow({});

        row.getCell("A").value = rowNumber - 1;
        row.getCell("B").value = employee.fullName;
        row.getCell("C").value = employeeSalary.name;
        row.getCell("D").value = employeeSalary.amount || 0;

        let deductedAmount = 0;

        for (const deductibleType of deductibleTypes) {
          if (deductibleType.enumaration === employeeSalary.name) {
            if (deductibleType.type === "FLAT") {
              deductedAmount += deductibleType.amount || 0;
            } else if (deductibleType.type === "PERCENTAGE") {
              const percentageDeductedAmount =
                ((employeeSalary.amount || 0) * (deductibleType.amount || 0)) /
                100;
              deductedAmount += percentageDeductedAmount;
            }

            row.getCell(deductibleType.name || "").value =
              deductibleType.type === "PERCENTAGE"
                ? `${deductibleType.amount}%`
                : deductibleType.amount;
          } else {
            row.getCell(deductibleType.name || "").value = 0;
          }
        }

        const netAmount = (employeeSalary.amount || 0) - deductedAmount;
        row.getCell(columns[columns.length - 2].key).value = deductedAmount;
        row.getCell(columns[columns.length - 1].key).value = netAmount;

        rowNumber++;
      }
    }

    let filename = "EMPLOYEES PAYROLL";
    if (dto.id && employees.length > 0) {
      // Generate filename based on employee full names
      const employeeNames = employees.map((employee) => employee.fullName);
      filename = `${employeeNames.join("_")}_PAYROLL`;
    }

    return {
      workbook,
      filename: `${filename}`,
    };
  }
}
