import * as React from 'react';
import { Text, View } from 'react-native';

import { ExpoMediapipeFaceDetectorViewProps } from './ExpoMediapipeFaceDetector.types';

export default function ExpoMediapipeFaceDetectorView(props: ExpoMediapipeFaceDetectorViewProps) {
  React.useEffect(() => {
    if (props.onError) {
      props.onError({
        nativeEvent: {
          message: 'MediaPipe face detection is not supported on web platform',
          code: 'WEB_NOT_SUPPORTED'
        }
      });
    }
  }, [props.onError]);

  return (
    <View style={[{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f0f0f0'
    }, props.style]}>
      <Text style={{ 
        fontSize: 16, 
        color: '#666',
        textAlign: 'center',
        marginHorizontal: 20
      }}>
        MediaPipe Face Detection is not supported on web platform.{'\n'}
        Please use iOS or Android for face detection features.
      </Text>
    </View>
  );
}
