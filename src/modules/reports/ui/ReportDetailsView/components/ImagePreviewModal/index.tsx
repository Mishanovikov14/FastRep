import { useMemo } from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, View } from 'react-native';

import { CloseIcon } from '@/assets/icons/CloseIcon';
import { useUIContext } from '@/UIProvider/useUIContext';
import { scaleHorizontal } from '@/utils/scaling';

import { getStyles } from './styles';

interface IPreviewImage {
  id: string;
  uri: string;
}

interface IProps {
  images: IPreviewImage[];
  onClose(): void;
  selectedAssetId?: string;
}

const previewWidth = Dimensions.get('window').width;

export const ImagePreviewModal = ({ images, onClose, selectedAssetId }: IProps) => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const selectedIndex = Math.max(
    0,
    images.findIndex((image) => image.id === selectedAssetId),
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={Boolean(selectedAssetId)}
    >
      <View accessibilityViewIsModal style={styles.container}>
        <FlatList
          data={images}
          getItemLayout={(_data, index) => ({ index, length: previewWidth, offset: previewWidth * index })}
          horizontal
          initialScrollIndex={selectedIndex}
          keyExtractor={(item) => item.id}
          pagingEnabled
          renderItem={({ item }) => (
            <View style={styles.imagePage}>
              <Image accessibilityIgnoresInvertColors resizeMode="contain" source={{ uri: item.uri }} style={styles.image} />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
        <Pressable
          accessibilityLabel={String(t('common.close'))}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={styles.closeButton}
        >
          <CloseIcon color={colors.white} height={scaleHorizontal(26)} width={scaleHorizontal(26)} />
        </Pressable>
      </View>
    </Modal>
  );
};
