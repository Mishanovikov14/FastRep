import type { TextInputProps } from 'react-native';

export interface IProps extends Omit<TextInputProps, 'editable' | 'onChangeText' | 'value'> {
  disabled?: boolean;
  error?: string;
  label: string;
  onChangeText(value: string): void;
  value: string;
}
