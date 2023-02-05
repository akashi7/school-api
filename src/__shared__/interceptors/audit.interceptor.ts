import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Class representing a Request interceptor
 * for API requests to provide logging of users access types
 * a payload object
 * @author Brian Gitego
 * @version 1.0
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const { statusCode } = response;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        Logger.log(
          `[REQUEST] ${statusCode} ${method} ${url} by ${
            request.user?.role || ""
          } ${request?.user?.fullName || "anonymous"} ${duration}ms`,
          context.getClass().name,
        );
      }),
    );
  }
}
