export interface IProps {
  actionTitle?: string;
  isLeadingActionLoading?: boolean;
  leadingActionTitle?: string;
  onAction?(): void;
  onBack?(): void;
  onLeadingAction?(): void;
  title: string;
}
