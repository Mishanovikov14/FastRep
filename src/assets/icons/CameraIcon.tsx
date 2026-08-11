import { Circle, Path, Rect, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const CameraIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Rect fill="none" height={14} rx={2.5} stroke={color} strokeWidth={1.8} width={20} x={2} y={6.5} />
      <Path d="M8 6.5L9.5 4H14.5L16 6.5" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={1.8} />
      <Circle cx={12} cy={13.5} fill="none" r={3.5} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
};
