import type { ButtonVariant } from '@/UIKit/Button/types';

export interface ICustomAlertAction {
  disabled?: boolean;
  key: string;
  loading?: boolean;
  onPress(): void;
  title: string;
  variant?: ButtonVariant;
}
