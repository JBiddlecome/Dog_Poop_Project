import { Platform, StatusBar } from 'react-native';

// useSafeAreaInsets can return 0 on Android in edge-to-edge mode (RN 0.79+).
// StatusBar.currentHeight is always accurate on Android.
export function safeTop(insets) {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight ?? insets.top ?? 24;
  }
  return insets.top;
}
