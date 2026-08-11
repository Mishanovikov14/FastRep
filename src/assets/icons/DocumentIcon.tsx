import { Path, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const DocumentIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Path d="M6 2.5H14L19 7.5V21.5H6V2.5Z" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M14 2.5V7.5H19M9 12H16M9 16H16" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
};
