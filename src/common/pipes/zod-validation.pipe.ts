import { Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, type ZodTypeAny } from 'zod';

@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny>
  implements PipeTransform<unknown, T['_output']>
{
  constructor(private readonly schema: T) {}

  transform(value: unknown): T['_output'] {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }

      throw error;
    }
  }
}
