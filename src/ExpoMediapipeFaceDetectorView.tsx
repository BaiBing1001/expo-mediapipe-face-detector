import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoMediapipeFaceDetectorViewProps } from './ExpoMediapipeFaceDetector.types';

const NativeView: React.ComponentType<ExpoMediapipeFaceDetectorViewProps> =
  requireNativeView('ExpoMediapipeFaceDetector');

export default function ExpoMediapipeFaceDetectorView(props: ExpoMediapipeFaceDetectorViewProps) {
  const { enabled = true, ...otherProps } = props;
  
  // Only render the native view if enabled
  if (!enabled) {
    return null;
  }
  
  return <NativeView {...otherProps} />;
}
