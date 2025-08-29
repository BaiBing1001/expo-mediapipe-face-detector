import * as React from 'react';
import type { FaceDetectionResult, FrameProcessorConfig } from './ExpoMediapipeFaceDetector.types';

// Types for Vision Camera integration (will be available when Vision Camera is installed)
interface VisionCameraProxy {
  initFrameProcessorPlugin: (name: string, options: any) => any;
}

declare const VisionCameraProxy: VisionCameraProxy | undefined;

type Frame = {
  width: number;
  height: number;
  bytesPerRow: number;
  pixelFormat: string;
};

let plugin: any = null;

// Initialize plugin lazily
function getPlugin() {
  if (!plugin && typeof VisionCameraProxy !== 'undefined') {
    try {
      plugin = VisionCameraProxy.initFrameProcessorPlugin('detectFaces', {});
    } catch (error) {
      console.warn('Failed to initialize MediaPipe Face Detector plugin:', error);
    }
  }
  return plugin;
}

/**
 * Detects faces in a Vision Camera frame using MediaPipe
 * @param frame The camera frame from Vision Camera
 * @param config Optional configuration for face detection
 * @returns Promise resolving to face detection results
 */
export function detectFaces(frame: Frame, config?: FrameProcessorConfig): FaceDetectionResult {
  'worklet';
  
  const detectorPlugin = getPlugin();
  if (!detectorPlugin) {
    throw new Error('MediaPipe Face Detector plugin not found. Make sure react-native-vision-camera is installed and the native plugin is properly configured.');
  }
  
  return detectorPlugin.call(frame, {
    minDetectionConfidence: config?.minDetectionConfidence ?? 0.5,
    minTrackingConfidence: config?.minTrackingConfidence ?? 0.5,
    maxNumFaces: config?.maxNumFaces ?? 2,
    enableFaceLandmarks: config?.enableFaceLandmarks ?? true,
    enableFaceClassification: config?.enableFaceClassification ?? false,
    runningMode: config?.runningMode ?? 'LIVE_STREAM'
  }) as FaceDetectionResult;
}

/**
 * React Hook for using face detection with Vision Camera
 * @param config Configuration for face detection
 * @returns Object containing the frame processor and configuration
 */
export function useFaceDetection(config?: FrameProcessorConfig) {
  const frameProcessor = React.useCallback((frame: Frame) => {
    'worklet';
    return detectFaces(frame, config);
  }, [config]);

  return {
    frameProcessor,
    config
  };
}
