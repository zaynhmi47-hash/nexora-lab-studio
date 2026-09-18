import { useWindowDimensions } from 'react-native';

import { getResponsiveSize, type ResponsiveSize } from './breakpoints';

export interface ResponsiveState {
  width: number;
  height: number;
  size: ResponsiveSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isUltrawide: boolean;
  isLandscape: boolean;
}

export function useResponsive(): ResponsiveState {
  const { width, height } = useWindowDimensions();
  const size = getResponsiveSize(width);

  return {
    width,
    height,
    size,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isUltrawide: width >= 1440,
    isLandscape: width > height,
  };
}
