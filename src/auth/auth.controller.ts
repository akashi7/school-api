import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { Response } from "express";
import {
  BadRequestResponse,
  ErrorResponses,
  OkResponse,
  UnauthorizedResponse,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { AuthService } from "./auth.service";
import { Protected } from "./decorators/auth.decorator";
import { GetUser } from "./decorators/get-user.decorator";
import {
  AdminLoginDto,
  ParentLoginDto,
  SchoolLoginDto,
  StudentLoginDto,
} from "./dto/login.dto";
import JwtRefreshGuard from "./guards/jwt-refresh.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login/admin")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.adminLogin(
      dto,
    );
    response.cookie("nestpay_jwt", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    response.cookie("nestpay_refresh_jwt", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return {
      message: "You have logged in successfully",
      payload: { refreshToken },
    };
  }
  @Post("/login/student")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async studentLogin(
    @Body() dto: StudentLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.studentLogin(
      dto,
    );
    response.cookie("nestpay_jwt", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    response.cookie("nestpay_refresh_jwt", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return {
      message: "You have logged in successfully",
      payload: { refreshToken },
    };
  }

  @Post("/login/school")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async schoolLogin(
    @Body() dto: SchoolLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.schoolLogin(
      dto,
    );
    response.cookie("nestpay_jwt", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    response.cookie("nestpay_refresh_jwt", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return {
      message: "You have logged in successfully",
      payload: { refreshToken },
    };
  }

  @Post("/login/parent")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async parentLogin(
    @Body() dto: ParentLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.parentLogin(
      dto,
    );
    response.cookie("nestpay_jwt", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    response.cookie("nestpay_refresh_jwt", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return {
      message: "You have logged in successfully",
      payload: { refreshToken },
    };
  }

  @Get("/refresh-token")
  @OkResponse()
  @ApiCookieAuth()
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @Res({ passthrough: true }) response: Response,
    @GetUser() user: User,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.refreshToken(
      user,
    );
    response.cookie("tss_jwt", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return {
      message: "Token refreshed successfully",
      payload: { refreshToken },
    };
  }

  @Get("/logout")
  @OkResponse()
  @Protected()
  async logout(
    @Res({ passthrough: true }) response: Response,
    @GetUser() user: User,
  ): Promise<GenericResponse<void>> {
    await this.authService.logout(user);
    response.clearCookie("tss_jwt");
    response.clearCookie("tss_refresh_jwt");
    return {
      message: "Logged out successfully",
    };
  }
}
