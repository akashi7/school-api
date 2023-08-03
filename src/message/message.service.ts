import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Messages, Prisma, User } from "@prisma/client";
import { catchError, lastValueFrom } from "rxjs";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { MailService } from "src/mail/mail.service";
import { PrismaService } from "src/prisma.service";
import { IAppConfig } from "../__shared__/interfaces/app-config.interface";
import { sendMailDto } from "./dto/sendMail.dto";

@Injectable()
export class MessageService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<IAppConfig>,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createMessage(phone: string) {
    const credentials = `${this.configService.get("sms").username}:${
      this.configService.get("sms").password
    }`;

    const encodedCredentials = Buffer.from(credentials).toString("base64");

    const msg = encodeURIComponent("testing");
    const tel = encodeURIComponent(phone);
    const sender = encodeURIComponent("SchoolNest");

    const response = await lastValueFrom(
      this.httpService
        .post<any>(
          `${
            this.configService.get("sms").url
          }/recipients=${tel}&sender=${sender}&message=${msg}`,
          "",
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${encodedCredentials}`,
            },
          },
        )
        .pipe(
          catchError((err) => {
            console.log({ err });
            throw new BadRequestException("Error sending message");
          }),
        ),
    );
    if (response.data.success === false && response.data.response) {
      const errors = response.data.response[0].errors;
      throw new BadRequestException(errors);
    }
    return response.data.response;
  }

  async SendMail(dto: sendMailDto, User: User) {
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: {
        current: true,
      },
    });

    let users: any[];

    if (dto.streamIds && dto.streamIds.length > 0) {
      const students = await this.prismaService.studentPromotion.findMany({
        where: {
          streamId: {
            in: dto.streamIds,
          },
          academicYearId: academicYear.id,
        },
        include: {
          student: true,
        },
      });
      users = students.map(
        (studentPromotion) => studentPromotion.student.email,
      );
    }
    if (!dto.streamIds && dto.streamIds.length === 0) {
      const allUsers = await this.prismaService.user.findMany({
        where: {
          role: {
            in: dto.to,
          },
        },
      });
      users = allUsers;
    }

    const emailPromises = users
      .filter((user) => user.email && dto.messageType.includes("EMAIL"))
      .map(async (user) => {
        try {
          await this.mailService.sendMail(
            user.email,
            dto.subject,
            user.schoolId ? user.email : "no-reply@schoolnestpay.com",
            dto.content,
          );
        } catch (error) {
          console.error(
            `Error sending email to user with role ${user.role}:`,
            error,
          );
        }
      });

    await Promise.all(emailPromises);

    try {
      await this.prismaService.messages.create({
        data: {
          to: dto.to,
          messageType: dto.messageType,
          message: dto.content,
          subject: dto.subject,
          schoolId: User.schoolId,
        },
      });
    } catch (error) {
      console.error("Error creating messages entry:", error);
    }

    return;
  }

  async getAllMessages(user: User, { page, size }: IPagination) {
    let messages: any;
    if (!user.schoolId) {
      messages = await paginate<Messages, Prisma.MessagesFindManyArgs>(
        this.prismaService.messages,
        {
          where: {
            schoolId: null,
          },
        },
        +page,
        +size,
      );
    } else {
      messages = await paginate<Messages, Prisma.MessagesFindManyArgs>(
        this.prismaService.messages,
        {
          where: {
            schoolId: user.schoolId,
          },
        },
        +page,
        +size,
      );
    }
    return messages;
  }
}
