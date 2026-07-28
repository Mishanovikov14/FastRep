import { Path, Rect, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const ReportsIcon = ({ color, height = 24, width = 24 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Rect fill="none" height={17} rx={2} stroke={color} strokeWidth={1.8} width={14} x={5} y={3.5} />
      <Path d="M8.5 8H15.5M8.5 12H15.5M8.5 16H13" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </Svg>
  );
};
