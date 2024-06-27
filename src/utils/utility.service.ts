import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
  async fetchWithTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    defaultValue: any,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(defaultValue), timeout);
    });

    try {
      const result = await Promise.race<Promise<T>>([promise, timeoutPromise]);
      return result as T;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
