import { Circle, Path, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const ErrorIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Circle cx={12} cy={12} fill="none" r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7.5v6M12 17h.01" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
};
