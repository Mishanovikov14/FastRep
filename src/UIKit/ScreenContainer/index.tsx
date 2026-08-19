import { ReactElement, ReactNode, RefObject, useMemo } from 'react';
import { Keyboard, Pressable, RefreshControlProps, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView, KeyboardAwareScrollViewRef, KeyboardStickyView } from 'react-native-keyboard-controller';

import { useAppSafeAreaInsets } from '@/hooks/useAppSafeAreaInsets';
import { Gradient } from '@/UIKit/Gradient';
import { useUIContext } from '@/UIProvider/useUIContext';
import { scaleVertical } from '@/utils/scaling';

import { useKeyboardStickyLayout } from './presenters/useKeyboardStickyLayout';
import { getStyles } from './styles';
import { Edge } from 'react-native-safe-area-context';

interface IProps {
  backgroundColor?: string;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  footerComponent?: ReactNode;
  headerComponent?: ReactNode;
  isKeyboardAvoiding?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollEnabled?: boolean;
  scrollRef?: RefObject<KeyboardAwareScrollViewRef | null>;
  withGradient?: boolean;
}

export const ScreenContainer = ({
  backgroundColor,
  children,
  containerStyle,
  contentContainerStyle,
  edges,
  footerComponent,
  headerComponent,
  isKeyboardAvoiding = false,
  refreshControl,
  scrollEnabled = false,
  scrollRef,
  withGradient = false,
}: IProps) => {
  const { colors, spacing } = useUIContext();
  const styles = useMemo(() => getStyles(colors, backgroundColor), [backgroundColor, colors]);
  const safeAreaInsets = useAppSafeAreaInsets();
  const bottomOffset = scaleVertical(spacing.xl);
  const { extraKeyboardSpace, onStickyLayout, scrollBottomOffset, stickyOpenedOffset } = useKeyboardStickyLayout();
  const keyboardBottomOffset = footerComponent ? scrollBottomOffset : bottomOffset;
  const edgesStyle = useMemo(() => {
    if (!edges) {
      return {
        paddingBottom: safeAreaInsets.bottom,
        paddingTop: safeAreaInsets.top,
      };
    }

    return {
      paddingBottom: edges.includes('bottom') ? safeAreaInsets.bottom : undefined,
      paddingLeft: edges.includes('left') ? safeAreaInsets.left : undefined,
      paddingRight: edges.includes('right') ? safeAreaInsets.right : undefined,
      paddingTop: edges.includes('top') ? safeAreaInsets.top : undefined,
    };
  }, [edges, safeAreaInsets]);

  return (
    <View style={[styles.mainContainer, edgesStyle]}>
      {withGradient ? <Gradient /> : null}
      {headerComponent}

      {isKeyboardAvoiding ? (
        <>
          {scrollEnabled ? (
            <>
              <KeyboardAwareScrollView
                bottomOffset={keyboardBottomOffset}
                bounces={Boolean(refreshControl)}
                contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
                extraKeyboardSpace={footerComponent ? extraKeyboardSpace : undefined}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                ref={scrollRef}
                refreshControl={refreshControl}
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
              >
                <Pressable onPress={Keyboard.dismiss} style={styles.container}>
                  {children}
                </Pressable>
              </KeyboardAwareScrollView>
              {footerComponent ? (
                <KeyboardStickyView
                  offset={{
                    closed: 0,
                    opened: stickyOpenedOffset,
                  }}
                >
                  <View onLayout={onStickyLayout}>{footerComponent}</View>
                </KeyboardStickyView>
              ) : null}
            </>
          ) : (
            <KeyboardAvoidingView style={[styles.container, containerStyle]}>
              <Pressable onPress={Keyboard.dismiss} style={styles.container}>
                {children}
              </Pressable>
            </KeyboardAvoidingView>
          )}
        </>
      ) : (
        <>
          {scrollEnabled ? (
            <ScrollView
              bounces={Boolean(refreshControl)}
              contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              ref={scrollRef}
              refreshControl={refreshControl}
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.container, containerStyle]}>{children}</View>
          )}
        </>
      )}
    </View>
  );
};
