# Expo MediaPipe Face Detector

A React Native/Expo module that provides real-time face detection using Google's MediaPipe framework. This module seamlessly integrates with React Native Vision Camera for high-performance face detection in mobile applications.

## Features

- ✨ Real-time face detection using MediaPipe
- 📱 Works with React Native Vision Camera
- 🎯 Face bounding boxes and landmarks
- ⚡ High-performance native implementation
- 🔧 Configurable detection parameters
- 📊 Confidence scores for detected faces
- 🎨 Support for both iOS and Android

## Installation

```bash
npm install expo-mediapipe-face-detector
# or
yarn add expo-mediapipe-face-detector
```

### Prerequisites

This module requires React Native Vision Camera for camera functionality:

```bash
npm install react-native-vision-camera
```

Follow the [Vision Camera installation guide](https://react-native-vision-camera.com/docs/guides) for setup.

### Platform Setup

#### iOS Setup

1. Add MediaPipe models to your iOS project:
   - Download `face_detection_short_range.tflite` from [MediaPipe Models](https://developers.google.com/mediapipe/solutions/vision/face_detector)
   - Add the model file to `ios/Models/` directory in your project
   - Ensure the model is included in your app bundle

2. Update your `Podfile` if needed:
   ```ruby
   pod 'MediaPipeTasksVision', '~> 0.10.0'
   ```

#### Android Setup

1. Add MediaPipe models to your Android project:
   - Download `face_detection_short_range.tflite` from [MediaPipe Models](https://developers.google.com/mediapipe/solutions/vision/face_detector)
   - Place the model file in `android/app/src/main/assets/`

2. Ensure your `android/app/build.gradle` has the minimum SDK version:
   ```gradle
   android {
     defaultConfig {
       minSdkVersion 21
     }
   }
   ```

## Usage

### Basic Setup

```typescript
import ExpoMediapipeFaceDetector, {
  ExpoMediapipeFaceDetectorView,
  FaceDetectorConfig,
  FaceDetectionResult,
} from 'expo-mediapipe-face-detector';

// Initialize the detector
const config: FaceDetectorConfig = {
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  maxNumFaces: 2,
  enableFaceLandmarks: true,
  runningMode: 'LIVE_STREAM'
};

await ExpoMediapipeFaceDetector.initializeDetector(config);
```

### Camera Integration with Native View

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { ExpoMediapipeFaceDetectorView } from 'expo-mediapipe-face-detector';

export default function CameraScreen() {
  const [faces, setFaces] = useState([]);

  const handleFaceDetection = (event) => {
    const { faces } = event.nativeEvent;
    setFaces(faces);
    console.log(`Detected ${faces.length} faces`);
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpoMediapipeFaceDetectorView
        config={{
          minDetectionConfidence: 0.6,
          maxNumFaces: 3,
          enableFaceLandmarks: true,
        }}
        enabled={true}
        onFaceDetected={handleFaceDetection}
        style={{ flex: 1 }}
      />
    </View>
  );
}
```

### Vision Camera Integration

```tsx
import React from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { detectFaces } from 'expo-mediapipe-face-detector';

export default function VisionCameraScreen() {
  const devices = useCameraDevices();
  const device = devices.front;

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    const faces = detectFaces(frame, {
      minDetectionConfidence: 0.5,
      maxNumFaces: 2,
    });
    
    console.log(`Found ${faces.length} faces`);
  }, []);

  if (!device) return null;

  return (
    <Camera
      style={{ flex: 1 }}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  );
}
```

### Image Processing

```typescript
// Detect faces in an image from URL
const result = await ExpoMediapipeFaceDetector.detectFacesInImage(
  'https://example.com/image.jpg'
);

// Detect faces in base64 image
const base64Result = await ExpoMediapipeFaceDetector.detectFacesInBase64(
  base64ImageString
);

console.log(`Found ${result.faces.length} faces`);
result.faces.forEach((face, index) => {
  console.log(`Face ${index + 1}:`);
  console.log(`- Confidence: ${face.confidence}`);
  console.log(`- Bounding box: ${JSON.stringify(face.boundingBox)}`);
  console.log(`- Landmarks: ${face.landmarks.length}`);
});
```

## API Reference

### Types

#### `FaceDetectorConfig`
```typescript
interface FaceDetectorConfig {
  minDetectionConfidence?: number; // 0.0 - 1.0, default: 0.5
  minTrackingConfidence?: number;  // 0.0 - 1.0, default: 0.5
  maxNumFaces?: number;           // default: 2
  enableFaceLandmarks?: boolean;  // default: true
  enableFaceClassification?: boolean; // default: false
  runningMode?: 'IMAGE' | 'VIDEO' | 'LIVE_STREAM'; // default: 'IMAGE'
}
```

#### `FaceDetectionResult`
```typescript
interface FaceDetectionResult {
  faces: Face[];
  imageWidth: number;
  imageHeight: number;
  timestamp: number;
}

interface Face {
  boundingBox: BoundingBox;
  landmarks: FaceLandmark[];
  confidence: number;
  faceId?: string;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Methods

#### `initializeDetector(config?: FaceDetectorConfig): Promise<void>`
Initialize the face detector with optional configuration.

#### `detectFacesInImage(imageUri: string): Promise<FaceDetectionResult>`
Detect faces in an image from a URI.

#### `detectFacesInBase64(base64Image: string): Promise<FaceDetectionResult>`
Detect faces in a base64-encoded image.

#### `getSupportedFeatures(): Promise<string[]>`
Get list of supported features.

#### `isInitialized(): boolean`
Check if the detector is initialized.

### Components

#### `ExpoMediapipeFaceDetectorView`
Native camera view component with built-in face detection.

**Props:**
- `config?: FaceDetectorConfig` - Detection configuration
- `enabled?: boolean` - Enable/disable detection
- `onFaceDetected?: (event: { nativeEvent: FaceDetectionResult }) => void`
- `onError?: (event: { nativeEvent: { message: string, code?: string } }) => void`
- `style?: StyleProp<ViewStyle>`

### Frame Processor (Vision Camera)

#### `detectFaces(frame: Frame, config?: FrameProcessorConfig): FaceDetectionResult`
Process a Vision Camera frame for face detection.

#### `useFaceDetection(config?: FrameProcessorConfig)`
React hook for easy Vision Camera integration.

## Configuration Options

### Detection Parameters

- **minDetectionConfidence**: Minimum confidence threshold for face detection (0.0-1.0)
- **minTrackingConfidence**: Minimum confidence threshold for face tracking (0.0-1.0)
- **maxNumFaces**: Maximum number of faces to detect
- **enableFaceLandmarks**: Enable facial landmark detection
- **runningMode**: Detection mode (IMAGE, VIDEO, LIVE_STREAM)

### Performance Tips

1. **Use appropriate confidence thresholds**: Higher values reduce false positives but may miss valid faces
2. **Limit maxNumFaces**: Detecting fewer faces improves performance
3. **Choose the right model**: Use `face_detection_short_range.tflite` for close-up scenarios
4. **Optimize camera resolution**: Lower resolutions process faster

## Troubleshooting

### Common Issues

1. **"Face detector not initialized"**
   - Ensure you call `initializeDetector()` before using detection methods

2. **"Model not found"**
   - Verify the `.tflite` model file is in the correct location
   - iOS: Bundle the model in your app resources
   - Android: Place in `android/app/src/main/assets/`

3. **Poor detection performance**
   - Adjust `minDetectionConfidence` threshold
   - Ensure good lighting conditions
   - Check camera focus and resolution

4. **Camera permission errors**
   - Grant camera permissions following Vision Camera setup guide

### Performance Optimization

```typescript
// For real-time use
const realtimeConfig = {
  minDetectionConfidence: 0.7,
  maxNumFaces: 1,
  enableFaceLandmarks: false,
  runningMode: 'LIVE_STREAM'
};

// For accuracy
const accurateConfig = {
  minDetectionConfidence: 0.3,
  maxNumFaces: 5,
  enableFaceLandmarks: true,
  runningMode: 'IMAGE'
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

- Built with [Google MediaPipe](https://mediapipe.dev/)
- Integrates with [React Native Vision Camera](https://react-native-vision-camera.com/)
- Created using [Expo Modules API](https://docs.expo.dev/modules/)
