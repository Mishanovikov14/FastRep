import type { RootNavigationState } from './types';

interface IRootNavigationStateInput {
  isAuthorized: boolean;
  isSessionRestored: boolean;
}

export const getRootNavigationState = ({
  isAuthorized,
  isSessionRestored,
}: IRootNavigationStateInput): RootNavigationState => {
  if (!isSessionRestored) {
    return 'splash';
  }

  return isAuthorized ? 'app' : 'guest';
};
