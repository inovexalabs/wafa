import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route (or a whole controller) out of the global AuthGuard. Every
 * other route requires a valid session, so a new controller that forgets
 * @UseGuards(AuthGuard) fails closed instead of being world-readable.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
