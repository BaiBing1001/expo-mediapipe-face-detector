import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoMediapipeFaceDetectorViewProps } from './ExpoMediapipeFaceDetector.types';

const NativeView: React.ComponentType<ExpoMediapipeFaceDetectorViewProps> =
  requireNativeView('ExpoMediapipeFaceDetector');

export default function ExpoMediapipeFaceDetectorView(props: ExpoMediapipeFaceDetectorViewProps) {
  return <NativeView {...props} />;
}
