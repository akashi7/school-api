import {
  Global,
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Classroom,
  EAcademicTerm,
  EGender,
  ERole,
  ESchoolType,
  PrismaClient,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { IAppConfig } from "./__shared__/interfaces/app-config.interface";

@Injectable()
@Global()
export class PrismaService extends PrismaClient implements OnModuleInit {
  schoolId: string;
  parentId: string;
  constructor(private readonly configService: ConfigService<IAppConfig>) {
    super({ datasources: { db: { url: configService.get("databaseUrl") } } });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on("beforeExit", async () => {
      await app.close();
    });
  }

  /**
   * Run database seeds
   */
  async seed() {
    Logger.debug(`Start seeding...`);
    await this.seedAdmin();
    if (this.configService.get("env") === "development") {
      await this.seedParent();
      await this.seedSchool();
      await this.seedStudent();
    }

    Logger.debug(`Seeding finished.`);
  }

  /**
   * Seed the admin
   */
  private async seedAdmin() {
    if (!(await this.user.count({ where: { role: ERole.ADMIN } }))) {
      await this.user.create({
        data: {
          fullName: "Brian Gitego",
          email: process.env.ADMIN_EMAIL,
          password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
          username: "admin",
          role: ERole.ADMIN,
        },
      });
    }
  }

  /**
   * Seed a parent
   */
  private async seedParent() {
    let parent = await this.user.findFirst({
      where: { role: ERole.PARENT, phone: "+250788000001" },
    });
    if (!parent) {
      parent = await this.user.create({
        data: {
          role: ERole.PARENT,
          fullName: "John Smith",
          phone: "+250788000001",
        },
      });
    }
    this.parentId = parent.id;
  }

  /**
   * Seed school
   */
  private async seedSchool() {
    if (
      !(await this.user.count({
        where: { role: ERole.SCHOOL, username: "nestschool" },
      }))
    ) {
      await this.$transaction(async (tx) => {
        const school = await tx.school.create({
          data: {
            schoolName: "Nest School",
            schoolTitle: "Nest International School",
            schoolLogo:
              "https://veceltest-ivory.vercel.app/static/media/logo.404f54264269e58d523c.png",
            schoolType: ESchoolType.SECONDARY,
            hasStudentIds: false,
            countryName: "Rwanda",
            countryCode: "RW",
            address: "Kicukiro, Kigali",
          },
        });
        this.schoolId = school.id;
        await tx.user.create({
          data: {
            role: ERole.SCHOOL,
            username: "nestschool",
            password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
            schoolId: school.id,
            fullName: "Nest School",
          },
        });
      });
    }
  }

  /**
   * Seed a student
   */
  private async seedStudent() {
    const academicYear = await this.seedAcademicYear();
    const classroom = await this.seedClassroom();
    const stream = await this.seedStream(classroom);
    await this.$transaction(async (tx) => {
      // SEED STUDENT
      if (
        !(await tx.user.count({
          where: { role: ERole.STUDENT, email: "gitego@gmail.com" },
        }))
      ) {
        const student = await tx.user.create({
          data: {
            role: ERole.STUDENT,
            studentIdentifier: "20220101",
            fullName: "Brian Gitego",
            address: "Kicukiro, Kigali",
            email: "gitego@gmail.com",
            passportPhoto:
              "https://st.depositphotos.com/2101611/4338/v/600/depositphotos_43381243-stock-illustration-male-avatar-profile-picture.jpg",
            dob: new Date("01-01-1998"),
            gender: EGender.MALE,
            firstContactPhone: "+250788000002",
            secondContactPhone: "+250788000003",
            academicTerm: EAcademicTerm.TERM1,
            academicYearId: academicYear.id,
            streamId: stream.id,
            parentId: this.parentId,
            countryName: "Rwanda",
            countryCode: "RW",
            schoolId: this.schoolId,
          },
        });
        await tx.studentPromotion.create({
          data: {
            studentId: student.id,
            streamId: student.streamId,
            academicYearId: student.academicYearId,
          },
        });
      }
    });
  }

  private async seedAcademicYear() {
    let academicYear = await this.academicYear.findFirst({
      where: { name: "2023-2024" },
    });
    if (!academicYear) {
      academicYear = await this.academicYear.create({
        data: { name: "2023-2024", current: true },
      });
    }
    return academicYear;
  }

  private async seedClassroom() {
    let classroom = await this.classroom.findFirst({
      where: {
        schoolId: this.schoolId,
        name: { equals: "P6", mode: "insensitive" },
      },
    });
    if (!classroom) {
      classroom = await this.classroom.create({
        data: { name: "P6", schoolId: this.schoolId },
      });
    }
    return classroom;
  }

  private async seedStream(classroom: Classroom) {
    let stream = await this.stream.findFirst({
      where: {
        classroomId: classroom.id,
        name: { equals: "A", mode: "insensitive" },
      },
    });
    if (!stream) {
      stream = await this.stream.create({
        data: { name: "A", classroomId: classroom.id },
      });
    }
    return stream;
  }

  /**
   * Apply middleware to prisma for delete, find,...
   * @param prismaService [PrismaService]
   */
  applyPrismaMiddleware() {
    this.$use(async (params, next) => {
      // SET deletedAt when deleting
      if (params.action == "delete") {
        // Delete queries
        // Change action to an update
        params.action = "update";
        params.args["data"] = { deletedAt: new Date() };
      }
      if (params.action == "deleteMany") {
        // Delete many queries
        params.action = "updateMany";
        if (params.args.data != undefined) {
          params.args.data["deletedAt"] = new Date();
        } else {
          params.args["data"] = { deletedAt: new Date() };
        }
      }

      // Ignore records with deletedAt when updating
      if (params.action == "update") {
        // Change to updateMany - you cannot filter
        // by anything except ID / unique with findUnique
        params.action = "updateMany";
        // Add 'deleted' filter
        // ID filter maintained
        params.args.where["deletedAt"] = { isSet: false };
      }
      if (params.action == "updateMany") {
        if (params.args.where != undefined) {
          params.args.where["deletedAt"] = { isSet: false };
        } else {
          params.args["where"] = { deletedAt: { isSet: false } };
        }
      }

      // Ignore records with deletedAt when finding
      if (params.action === "findUnique" || params.action === "findFirst") {
        // Change to findFirst - you cannot filter
        // by anything except ID / unique with findUnique
        params.action = "findFirst";
        // Add 'deleted' filter
        // ID filter maintained
        params.args.where["deletedAt"] = { isSet: false };
      }
      if (params.action === "findMany" || params.action === "count") {
        // Find many queries
        if (params.args.where) {
          if (params.args.where.deletedAt == undefined) {
            // Exclude deleted records if they have not been explicitly requested
            params.args.where["deletedAt"] = { isSet: false };
          }
        } else {
          params.args["where"] = { deletedAt: { isSet: false } };
        }
      }
      return next(params);
    });
  }
}
