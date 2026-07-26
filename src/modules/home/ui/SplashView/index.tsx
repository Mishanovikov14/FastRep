import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';

import { useSplashViewPresenter } from './presenters/useSplashViewPresenter';
import { styles } from './styles';

export const SplashView = () => {
  useSplashViewPresenter();

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Loader size="large" />
    </ScreenContainer>
  );
};
