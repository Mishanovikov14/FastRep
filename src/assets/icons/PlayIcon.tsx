import { Path, Svg } from 'react-native-svg';

interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const PlayIcon = ({ color, height = 22, width = 22 }: IProps) => {
  return (
    <Svg accessibilityElementsHidden height={height} viewBox="0 0 24 24" width={width}>
      <Path d="M8 5.5v13l10-6.5L8 5.5Z" fill={color} />
    </Svg>
  );
};
