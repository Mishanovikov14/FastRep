import { Circle, Path, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const ProfileIcon = ({ color, height = 24, width = 24 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Circle cx={12} cy={8} fill="none" r={3.25} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 19C6.25 15.9 8.45 14.3 12 14.3C15.55 14.3 17.75 15.9 18.5 19"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
};
