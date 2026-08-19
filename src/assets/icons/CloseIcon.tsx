import { Path, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const CloseIcon = ({ color, height = 24, width = 24 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Path d="m6 6 12 12M18 6 6 18" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
};
