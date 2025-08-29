import { NativeModule, requireNativeModule } from 'expo';

import { ExpoMediapipeFaceDetectorModuleEvents, FaceDetectorConfig, FaceDetectionResult, VisionCameraFrame } from './ExpoMediapipeFaceDetector.types';

declare class ExpoMediapipeFaceDetectorModule extends NativeModule<ExpoMediapipeFaceDetectorModuleEvents> {
  // Configuration methods
  initializeDetector(config?: FaceDetectorConfig): Promise<void>;
  updateConfig(config: FaceDetectorConfig): Promise<void>;
  
  // Face detection methods
  detectFacesInImage(imageUri: string): Promise<FaceDetectionResult>;
  detectFacesInBase64(base64Image: string): Promise<FaceDetectionResult>;
  
  // Frame processor for Vision Camera
  processFrame(frame: VisionCameraFrame): Promise<FaceDetectionResult>;
  
  // Lifecycle methods
  startDetection(): Promise<void>;
  stopDetection(): Promise<void>;
  
  // Utility methods
  isInitialized(): boolean;
  getSupportedFeatures(): Promise<string[]>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoMediapipeFaceDetectorModule>('ExpoMediapipeFaceDetector');
