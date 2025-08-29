import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { detectFaces, FaceDetectionResult } from 'expo-mediapipe-face-detector';
import { runOnJS } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function VisionCameraFaceDetection() {
  const [faces, setFaces] = useState<FaceDetectionResult | null>(null);
  const devices = useCameraDevices();
  const device = devices.front;

  const updateFaces = useCallback((newFaces: FaceDetectionResult) => {
    setFaces(newFaces);
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    try {
      const detectionResult = detectFaces(frame, {
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
        maxNumFaces: 3,
        enableFaceLandmarks: true,
        runningMode: 'LIVE_STREAM'
      });
      
      // Run on JS thread to update state
      runOnJS(updateFaces)(detectionResult);
    } catch (error) {
      console.warn('Face detection error:', error);
    }
  }, [updateFaces]);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      
      {/* Overlay for face detection results */}
      <View style={styles.overlay}>
        {faces?.faces.map((face, index) => (
          <View
            key={index}
            style={[
              styles.faceBox,
              {
                left: face.boundingBox.x,
                top: face.boundingBox.y,
                width: face.boundingBox.width,
                height: face.boundingBox.height,
              },
            ]}
          >
            <Text style={styles.confidence}>
              {(face.confidence * 100).toFixed(0)}%
            </Text>
            
            {/* Render landmarks */}
            {face.landmarks.map((landmark, landmarkIndex) => (
              <View
                key={landmarkIndex}
                style={[
                  styles.landmark,
                  {
                    left: landmark.position.x - 2,
                    top: landmark.position.y - 2,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>
          Faces detected: {faces?.faces.length || 0}
        </Text>
        {faces && (
          <Text style={styles.infoText}>
            Frame: {faces.imageWidth}x{faces.imageHeight}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
  },
  confidence: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: '#00ff00',
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  landmark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff0000',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
