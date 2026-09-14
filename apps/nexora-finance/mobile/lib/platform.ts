import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

export function platformValue<T>(values: {
  web: T;
  native: T;
}): T {
  return isWeb ? values.web : values.native;
}
