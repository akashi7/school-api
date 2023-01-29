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
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
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
import { Auth } from "./decorators/auth.decorator";
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
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.adminLogin(
      dto,
    );
    return new GenericResponse("Admin logged in successfully", {
      accessToken,
      refreshToken,
    });
  }
  @Post("/login/student")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async studentLogin(
    @Body() dto: StudentLoginDto,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.studentLogin(
      dto,
    );
    return new GenericResponse("Student logged in successfully", {
      accessToken,
      refreshToken,
    });
  }

  @Post("/login/school")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async schoolLogin(
    @Body() dto: SchoolLoginDto,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.schoolLogin(
      dto,
    );
    return new GenericResponse("School logged in successfully", {
      accessToken,
      refreshToken,
    });
  }

  @Post("/login/parent")
  @OkResponse()
  @ErrorResponses(UnauthorizedResponse, BadRequestResponse)
  @HttpCode(HttpStatus.OK)
  async parentLogin(
    @Body() dto: ParentLoginDto,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.parentLogin(
      dto,
    );
    return new GenericResponse("Parent logged in successfully", {
      accessToken,
      refreshToken,
    });
  }

  @Get("/refresh-token")
  @OkResponse()
  @ApiSecurity("refresh")
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @Res({ passthrough: true }) response: Response,
    @GetUser() user: User,
  ): Promise<GenericResponse<{ refreshToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.refreshToken(
      user,
    );
    return new GenericResponse("Token refreshed successfully", {
      accessToken,
      refreshToken,
    });
  }

  @Get("/logout")
  @OkResponse()
  @Auth()
  async logout(
    @Res({ passthrough: true }) response: Response,
    @GetUser() user: User,
  ): Promise<GenericResponse<void>> {
    await this.authService.logout(user);
    return new GenericResponse("Logged out successfully");
  }
}
