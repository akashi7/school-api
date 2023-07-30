import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole, EenumurationType, Prisma, User } from "@prisma/client";
import { endOfMonth, getMonth, startOfMonth } from "date-fns";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { PrismaService } from "src/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { employeeFields } from "./dto/employee-fields";
import { EmployeeSearchDto } from "./dto/search-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

@Injectable()
export class EmployeeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Generate a employee identifier (eg:EMP2023013)
   * @returns employee identifier
   */
  async generateEmployeeId() {
    const now = new Date();
    const id =
      (await this.prismaService.user.count({
        where: {
          role: ERole.EMPLOYEE,
          createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
        },
      })) + 1;
    const month = getMonth(now);
    return `EMP${now.getFullYear()}${month > 9 ? month : `0${month}`}${id}`;
  }

  /**
   * Create a employee
   * @param dto create object
   * @param user logged in user
   * @returns user (employee)
   */

  async create(dto: CreateEmployeeDto, user: User) {
    return await this.prismaService.$transaction(async (tx) => {
      const school = await tx.school.findFirst({
        where: { id: user.schoolId },
      });
      if (!school) throw new BadRequestException("School not found");
      const existingEmailEmployee = await tx.user.findFirst({
        where: { email: dto.email },
      });
      if (existingEmailEmployee)
        throw new BadRequestException("Employee email already exists");
      const newEmployeeId = school.hasEmployeeIds
        ? dto.employeeIdentifier
        : await this.generateEmployeeId();
      const { amount, enumaration, from, to, ...restDto } = dto;
      const payload = await tx.user.create({
        data: {
          role: ERole.EMPLOYEE,
          ...restDto,
          employeeIdentifier: newEmployeeId,
          schoolId: user.schoolId,
        },
        select: { ...employeeFields },
      });
      await tx.employeeSalary.create({
        data: {
          employee: {
            connect: {
              id: payload.id,
            },
          },
          date: new Date(),
          amount,
          from,
          to,
          name: enumaration,
        },
      });
      return payload;
    });
  }

  /**
   * Find all employees
   * @param dto
   * @param param1
   * @param user
   * @returns
   */

  async findAll(
    dto: EmployeeSearchDto,
    { page, size }: IPagination,
    user: User,
  ) {
    const whereConditions: Prisma.UserWhereInput = {};
    const employeeWhereInput: Prisma.EmployeeSalaryWhereInput = {};
    if (dto.search) {
      whereConditions.OR = [
        {
          fullName: { contains: dto.search, mode: "insensitive" },
        },
        {
          employeeIdentifier: { contains: dto.search, mode: "insensitive" },
        },
      ];
    }

    if (dto.emunaration) {
      employeeWhereInput.name = dto.emunaration;
      whereConditions.employeeSalary = {
        some: { ...employeeWhereInput },
      };
    }

    let positionIds: string[];

    if (dto.position) {
      const positions = await this.prismaService.position.findMany({
        where: {
          name: {
            contains: dto.position,
            mode: "insensitive",
          },
          schoolId: user.schoolId,
        },
      });
      positionIds = positions.map((position) => position.id);
    }

    if (dto.emunaration && dto.current) {
      employeeWhereInput.name = dto.emunaration;
      employeeWhereInput.current = dto.current;
      whereConditions.employeeSalary = {
        some: { ...employeeWhereInput },
      };
    }

    let result: any;

    if (!user.schoolId) {
      result = await this.prismaService.user.findMany({
        where: {
          role: ERole.EMPLOYEE,
        },
      });
    } else {
      result = await paginate<User, Prisma.UserFindManyArgs>(
        this.prismaService.user,
        {
          where: {
            schoolId: user.schoolId,
            role: ERole.EMPLOYEE,
            ...whereConditions,
            positionId: {
              in: positionIds,
            },
          },
          include: {
            employeeSalary: {
              where: { ...employeeWhereInput },
              select: {
                name: true,
                amount: true,
                current: true,
              },
            },
            Position: true,
          },
        },
        +page,
        +size,
      );
    }

    return result;
  }

  /**
   * Find one employee
   * @param id employee id
   * @param user logged in user
   * @returns user (employee)
   */

  async findOne(id: string, user?: User) {
    const employee = await this.prismaService.user.findFirst({
      where: user
        ? {
            id,
            role: ERole.EMPLOYEE,
            schoolId: user.schoolId,
          }
        : { id, role: ERole.EMPLOYEE },
      select: {
        ...employeeFields,
        employeeSalary: {
          select: { id: true, name: true, amount: true, from: true, to: true },
        },
        school: true,
      },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    return employee;
  }

  /**
   * Update a employee
   * @param employeeId employee id
   * @param dto update object
   * @param user logged in user
   * @returns user (employee)
   */
  async update(employeeId: string, dto: UpdateEmployeeDto, user: User) {
    await this.findOne(employeeId, user);
    if (dto.email) {
      const existingEmailEmployee = await this.prismaService.user.findFirst({
        where: { id: { not: employeeId }, email: dto.email },
      });
      if (existingEmailEmployee)
        throw new BadRequestException("Email already exists");
    }

    const { amount, ...restDto } = dto;
    await this.prismaService.user.update({
      where: { id: employeeId },
      data: {
        ...restDto,
      },
    });
    await this.prismaService.employeeSalary.updateMany({
      where: {
        employeeId: employeeId,
        name: EenumurationType.SALARY,
      },
      data: { current: false },
    });
    await this.prismaService.employeeSalary.create({
      data: {
        employeeId,
        date: new Date(),
        amount,
        current: true,
      },
    });

    return await this.findOne(employeeId);
  }
}
