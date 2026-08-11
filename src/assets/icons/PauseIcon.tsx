import { Rect, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const PauseIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Rect fill={color} height={14} rx={1} width={4} x={6} y={5} />
      <Rect fill={color} height={14} rx={1} width={4} x={14} y={5} />
    </Svg>
  );
};
