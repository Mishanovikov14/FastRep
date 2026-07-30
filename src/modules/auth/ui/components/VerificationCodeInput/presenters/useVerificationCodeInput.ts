import type { RefObject } from 'react';
import { useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';

interface IPresenterInput {
  onChangeText(value: string): void;
}

export const useVerificationCodeInput = ({ onChangeText }: IPresenterInput) => {
  const inputRef = useRef<TextInput>(null);

  const onPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const onChange = useCallback(
    (value: string) => {
      onChangeText(value.replace(/\D/g, '').slice(0, 6));
    },
    [onChangeText],
  );

  return {
    inputRef: inputRef as RefObject<TextInput | null>,
    onChange,
    onPress,
  };
};
