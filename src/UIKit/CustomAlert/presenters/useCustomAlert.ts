import { useCallback, useState } from 'react';

export const useCustomAlert = () => {
  const [isVisible, setIsVisible] = useState(false);

  const onShow = useCallback(() => {
    setIsVisible(true);
  }, []);

  const onHide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    onHide,
    onShow,
  };
};
