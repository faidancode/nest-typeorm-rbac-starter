import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextState {
  requestId: string;
  method?: string;
  path?: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<Map<string, unknown>>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(new Map(Object.entries(state)), callback);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.storage.getStore()?.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.storage.getStore()?.set(key, value);
  }

  getRequestId(): string | undefined {
    return this.get<string>('requestId');
  }

  getSnapshot(): RequestContextState | undefined {
    const store = this.storage.getStore();
    if (!store) {
      return undefined;
    }

    const snapshot = Object.fromEntries(store.entries()) as Record<
      string,
      unknown
    >;

    if (typeof snapshot.requestId !== 'string') {
      return undefined;
    }

    return snapshot as unknown as RequestContextState;
  }
}
