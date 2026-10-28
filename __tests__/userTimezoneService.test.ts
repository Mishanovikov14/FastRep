import { getTimeZone } from 'react-native-localize';

import { updateProfile } from '@/entities/user/API/userApi';
import { getDeviceTimezone, synchronizeUserTimezone } from '@/entities/user/services/userTimezoneService';
import type { IUser } from '@/entities/user/types/user';

jest.mock('react-native-localize', () => ({
  getTimeZone: jest.fn(),
}));

jest.mock('@/entities/user/API/userApi', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('@/libs/logger/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

const user: IUser = {
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'runner@fastrep.dev',
  fullName: 'Fast Runner',
  id: 'user-1',
  isPremium: true,
  language: 'en',
  photoUrl: null,
  timezone: 'Europe/Kyiv',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('userTimezoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getTimeZone).mockReturnValue('Europe/Kyiv');
  });

  it('detects the installed runtime IANA timezone', () => {
    expect(getDeviceTimezone()).toBe('Europe/Kyiv');
  });

  it('does not update an already matching timezone', async () => {
    await expect(synchronizeUserTimezone(user)).resolves.toEqual(user);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('updates a changed timezone once and does not create a repeat loop', async () => {
    const updatedUser = { ...user, timezone: 'America/New_York' };
    jest.mocked(getTimeZone).mockReturnValue('America/New_York');
    jest.mocked(updateProfile).mockResolvedValue({
      data: updatedUser,
      isError: false,
      message: '',
    });

    const firstResult = await synchronizeUserTimezone(user);
    const secondResult = await synchronizeUserTimezone(firstResult);

    expect(firstResult).toEqual(updatedUser);
    expect(secondResult).toEqual(updatedUser);
    expect(updateProfile).toHaveBeenCalledTimes(1);
    expect(updateProfile).toHaveBeenCalledWith({
      timezone: 'America/New_York',
    });
  });

  it.each(['', 'Not/A_Timezone'])('does nothing when timezone detection is unusable: %p', async (timezone) => {
    jest.mocked(getTimeZone).mockReturnValue(timezone);

    await expect(synchronizeUserTimezone(user)).resolves.toEqual(user);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('keeps startup usable when the timezone update fails', async () => {
    jest.mocked(getTimeZone).mockReturnValue('Asia/Tokyo');
    jest.mocked(updateProfile).mockResolvedValue({
      isError: true,
      message: 'Unavailable',
      type: 'network_error',
    });

    await expect(synchronizeUserTimezone(user)).resolves.toEqual(user);
  });
});
