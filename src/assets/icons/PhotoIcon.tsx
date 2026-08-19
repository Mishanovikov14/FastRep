import { Circle, Path, Rect, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const PhotoIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Rect fill="none" height={18} rx={2.5} stroke={color} strokeWidth={1.8} width={20} x={2} y={3} />
      <Circle cx={8} cy={8.5} fill="none" r={2} stroke={color} strokeWidth={1.8} />
      <Path d="M4.5 18L9.5 13L13 16L16 12.5L21.5 18" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
};
