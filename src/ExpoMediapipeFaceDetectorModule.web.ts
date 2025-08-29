import { registerWebModule, NativeModule } from 'expo';

import { 
  ExpoMediapipeFaceDetectorModuleEvents, 
  FaceDetectorConfig,
  FaceDetectionResult 
} from './ExpoMediapipeFaceDetector.types';

class ExpoMediapipeFaceDetectorModule extends NativeModule<ExpoMediapipeFaceDetectorModuleEvents> {
  async initializeDetector(config: FaceDetectorConfig): Promise<void> {
    console.warn('MediaPipe face detection is not supported on web platform');
    throw new Error('Web platform not supported for MediaPipe face detection');
  }

  async detectFacesInImage(imageUri: string): Promise<FaceDetectionResult> {
    console.warn('MediaPipe face detection is not supported on web platform');
    throw new Error('Web platform not supported for MediaPipe face detection');
  }

  async detectFacesInBase64(base64Data: string): Promise<FaceDetectionResult> {
    console.warn('MediaPipe face detection is not supported on web platform');
    throw new Error('Web platform not supported for MediaPipe face detection');
  }

  async cleanup(): Promise<void> {
    // No-op for web
  }
}

export default registerWebModule(ExpoMediapipeFaceDetectorModule, 'ExpoMediapipeFaceDetectorModule');
