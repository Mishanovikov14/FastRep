import { getTimeZone } from 'react-native-localize';

import { updateProfile } from '@/entities/user/API/userApi';
import type { IUser } from '@/entities/user/types/user';
import { logger } from '@/libs/logger/logger';

export const getDeviceTimezone = (): string | undefined => {
  try {
    const timezone = getTimeZone().trim();

    if (!timezone) {
      return undefined;
    }

    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
    });
    formatter.format(0);

    return timezone;
  } catch {
    return undefined;
  }
};

export const synchronizeUserTimezone = async (user: IUser): Promise<IUser> => {
  const deviceTimezone = getDeviceTimezone();

  if (!deviceTimezone || user.timezone === deviceTimezone) {
    return user;
  }

  try {
    const response = await updateProfile({ timezone: deviceTimezone });

    if (response.isError || !response.data) {
      logger.warn('profile.timezone_update_failed', {
        errorCode: response.type ?? 'request_failed',
      });
      return user;
    }

    return response.data;
  } catch {
    logger.warn('profile.timezone_update_failed', {
      errorCode: 'unexpected_error',
    });
    return user;
  }
};
