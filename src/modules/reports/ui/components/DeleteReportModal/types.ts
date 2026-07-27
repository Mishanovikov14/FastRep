export interface IProps {
  isDeleting: boolean;
  onCancel(): void;
  onConfirm(): void;
  visible: boolean;
}
