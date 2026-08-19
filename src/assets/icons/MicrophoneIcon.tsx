import { Path, Rect, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const MicrophoneIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Rect fill="none" height={12} rx={4} stroke={color} strokeWidth={1.8} width={7} x={8.5} y={2.5} />
      <Path d="M5.5 11.5C5.5 15.1 8.4 18 12 18C15.6 18 18.5 15.1 18.5 11.5M12 18V22M8.5 22H15.5" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </Svg>
  );
};
