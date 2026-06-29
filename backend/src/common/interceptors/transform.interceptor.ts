import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Transform Interceptor — bọc mọi response thành format chuẩn:
 * { success: true, statusCode, message, data, timestamp }
 *
 * Controller có thể trả về object với { message, data } để custom message,
 * hoặc trả thẳng data để dùng message mặc định.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((result) => {
        // Cho phép controller trả về { message, data } để custom message
        const hasCustomShape =
          result && typeof result === 'object' && 'data' in result;

        return {
          success: true,
          statusCode: response.statusCode,
          message: hasCustomShape ? result.message : 'Thành công',
          data: hasCustomShape ? result.data : result,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
