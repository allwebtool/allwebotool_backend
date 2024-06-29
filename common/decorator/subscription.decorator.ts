// ensure-subscription.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ENSURE_SUBSCRIPTION_KEY = 'ensureSubscription';
export const EnsureSubscription = () => SetMetadata(ENSURE_SUBSCRIPTION_KEY, true);
