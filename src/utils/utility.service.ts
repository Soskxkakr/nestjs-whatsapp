import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {
  async fetchWithTimeout(
    promise: Promise<any>,
    timeout: number,
    defaultValue: any,
  ) {
    let timeoutHandle;

    const timeoutPromise = new Promise((resolve) => {
      timeoutHandle = setTimeout(() => resolve(defaultValue), timeout);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
