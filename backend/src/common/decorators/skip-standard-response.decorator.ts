import { SetMetadata } from '@nestjs/common';

export const SKIP_STANDARD_RESPONSE = 'skipStandardResponse' as const;

/** Skips {@link StandardResponseInterceptor} (e.g. raw redirects with `@Res()`). */
export const SkipStandardResponse = () =>
  SetMetadata(SKIP_STANDARD_RESPONSE, true);
