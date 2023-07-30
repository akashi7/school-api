import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendMail(to: string, subject: string, from: string, text: string) {
    const emailSent = await this.mailerService.sendMail({
      to,
      from,
      subject,
      text,
    });
    if (emailSent) return { message: "Email sent successfully" };
    else return { message: "Email Not sent" };
  }
}
