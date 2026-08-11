import { Path, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const PdfIcon = ({ color, height = 24, width = 24 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Path d="M6 2.5H14L19 7.5V21.5H6V2.5Z" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M14 2.5V7.5H19M8.5 16.5C11 14.8 12.8 12.4 13.3 9.8C12.5 12.7 13.5 15.6 16.3 17C13.9 15.8 10.8 15.6 8.5 16.5Z" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </Svg>
  );
};
