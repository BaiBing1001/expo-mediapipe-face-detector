import type { StyleProp, ViewStyle } from 'react-native';

// Face detection result types
export type FaceDetectionResult = {
  faces: Face[];
  imageWidth: number;
  imageHeight: number;
  timestamp: number;
};

export type Face = {
  boundingBox: BoundingBox;
  landmarks: FaceLandmark[];
  confidence: number;
  faceId?: string;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FaceLandmark = {
  type: LandmarkType;
  position: Position;
};

export type Position = {
  x: number;
  y: number;
  z?: number;
};

export enum LandmarkType {
  LEFT_EYE = 'LEFT_EYE',
  RIGHT_EYE = 'RIGHT_EYE',
  NOSE_TIP = 'NOSE_TIP',
  MOUTH_LEFT = 'MOUTH_LEFT',
  MOUTH_RIGHT = 'MOUTH_RIGHT',
  MOUTH_CENTER = 'MOUTH_CENTER',
  LEFT_EAR = 'LEFT_EAR',
  RIGHT_EAR = 'RIGHT_EAR',
  LEFT_CHEEK = 'LEFT_CHEEK',
  RIGHT_CHEEK = 'RIGHT_CHEEK',
  FOREHEAD_CENTER = 'FOREHEAD_CENTER',
  CHIN_GNATHION = 'CHIN_GNATHION',
  CHIN_LEFT_GONION = 'CHIN_LEFT_GONION',
  CHIN_RIGHT_GONION = 'CHIN_RIGHT_GONION'
}

// Configuration types
export type FaceDetectorConfig = {
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  maxNumFaces?: number;
  enableFaceLandmarks?: boolean;
  enableFaceClassification?: boolean;
  runningMode?: 'IMAGE' | 'VIDEO' | 'LIVE_STREAM';
};

// Event types
export type ExpoMediapipeFaceDetectorModuleEvents = {
  onFaceDetected: (result: FaceDetectionResult) => void;
  onError: (error: ErrorEventPayload) => void;
};

export type ErrorEventPayload = {
  message: string;
  code?: string;
};

// View props for camera integration
export type ExpoMediapipeFaceDetectorViewProps = {
  config?: FaceDetectorConfig;
  onFaceDetected?: (event: { nativeEvent: FaceDetectionResult }) => void;
  onError?: (event: { nativeEvent: ErrorEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
};

// Frame processor types for Vision Camera integration
export type FrameProcessorConfig = FaceDetectorConfig;

export type VisionCameraFrame = {
  width: number;
  height: number;
  bytesPerRow: number;
  planarFormat: string;
};
