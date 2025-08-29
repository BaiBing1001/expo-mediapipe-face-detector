import * as React from 'react';

import { ExpoMediapipeFaceDetectorViewProps } from './ExpoMediapipeFaceDetector.types';

export default function ExpoMediapipeFaceDetectorView(props: ExpoMediapipeFaceDetectorViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
