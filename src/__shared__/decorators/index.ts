/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiPropertyOptions,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IPagination } from '../../interfaces/page.interface';
import {
  getArraySchema,
  getGenericErrorResponseSchema,
  getGenericResponseSchema,
  getPaginatedSchema,
} from '../../utils/swagger.util';

export const PaginationParams = createParamDecorator(
  (_data, ctx: ExecutionContext): IPagination => {
    const req = ctx.switchToHttp().getRequest();
    return {
      page: +req?.query?.page || 1,
      limit: +req?.query?.limit || 10,
    };
  },
);

/**
 * Custom implementation of @ApiQuery for paginated endpoints
 * @returns @ApiQuery
 */
export function Paginated() {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
  );
}

/**
 * Custom implementation of @ApiQuery to set query parameters
 * @returns @ApiQuery
 */
export function QueryParam(
  name: string,
  required = true,
  enumType?: any,
): MethodDecorator {
  return ApiQuery({ name, required, enum: enumType });
}
/**
 * Custom implementation of @ApiOperation
 * @param summary description of the operation
 * @returns @ApiOperation
 */
export function Operation(summary: string) {
  return applyDecorators(
    ApiOperation({
      summary,
    }),
  );
}

/**
 * Custom implementation of @ApiResponse for general responses
 * @param status status code
 * @param model optional model to be returned
 * @returns @ApiResponse
 */
export function Response(status: number, model?: any) {
  if (status < 300)
    return applyDecorators(
      ApiResponse({
        status,
        ...getGenericResponseSchema(model),
      }),
    );
  else throw new TypeError('Status passed to decorator not a success status');
}

/**
 * Custom implementation of @ApiResponse for OK responses
 * @param model optional model to be returned
 * @returns @ApiResponse
 */
export function OkResponse(model?: any) {
  return applyDecorators(
    ApiResponse({
      status: HttpStatus.OK,
      ...getGenericResponseSchema(model),
    }),
  );
}

/**
 * Custom implementation of @ApiResponse for POST responses
 * @param model optional model to be returned
 * @returns @ApiResponse
 */
export function CreatedResponse(model?: any) {
  return applyDecorators(
    ApiCreatedResponse({
      ...getGenericResponseSchema(model),
    }),
  );
}

/**
 * Custom implementation of @ApiResponse for OK responses returning a paginated result
 * @param model optional model to be returned
 * @returns @ApiResponse
 */
export function PageResponse(model: any) {
  return applyDecorators(ApiOkResponse({ ...getPaginatedSchema(model) }));
}

/**
 * Custom implementation of @ApiResponse for OK responses returning an array
 * @param model optional model to be returned
 * @returns @ApiResponse
 */
export function OkArrayResponse(model: any) {
  return applyDecorators(
    ApiResponse({ status: HttpStatus.OK, ...getArraySchema(model) }),
  );
}

/**
 * Custom implementation of @ApiResponse for POST responses returning an array
 * @param model optional model to be returned
 * @returns @ApiResponse
 */
export function CreatedArrayResponse(model: any) {
  return applyDecorators(
    ApiResponse({ status: HttpStatus.CREATED, ...getArraySchema(model) }),
  );
}

/**
 * Combines error decorator functions for swagger
 * @param errorResponses a list of error response decorator functions
 * @returns wrapper combining all the error decorators
 */
export function ErrorResponses(...errorResponses: any[]) {
  return applyDecorators(
    ApiResponse({
      description: 'Error response schema.',
      ...getGenericErrorResponseSchema(),
    }),
    ...errorResponses.map((e) => e()),
  );
}

/**
 * Custom wrapper for @ApiUnauthorizedResponse
 */
export function UnauthorizedResponse() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}

/**
 * Custom wrapper for @ApiForbiddenResponse
 */
export function ForbiddenResponse() {
  return applyDecorators(
    ApiForbiddenResponse({
      description: 'Forbidden resource',
    }),
  );
}

/**
 * Custom wrapper for @ApiBadRequestResponse
 */
export function BadRequestResponse() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Invalid request',
    }),
  );
}

/**
 * Custom wrapper for @ApiConflictResponse
 */
export function ConflictResponse() {
  return applyDecorators(
    ApiConflictResponse({
      description: 'Conflict',
    }),
  );
}
/**
 * Custom wrapper for @ApiNotFoundResponse
 */
export function NotFoundResponse() {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Resource Not found',
    }),
  );
}

/**
 * Combines @ApiPropertyOptional and @IsOptional
 * @param options Options for @ApiPropertyOptional
 *
 */
export function OptionalProperty(options?: ApiPropertyOptions) {
  return applyDecorators(ApiPropertyOptional(options), IsOptional());
}
