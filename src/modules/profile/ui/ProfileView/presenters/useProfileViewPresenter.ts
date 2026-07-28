import type { TFunction } from 'i18next';

import { useLogout } from '@/hooks/useLogout';

interface IInput {
  t: TFunction;
}

export const useProfileViewPresenter = ({ t }: IInput) => {
  return useLogout(t);
};
