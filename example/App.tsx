import React, { useState, useEffect } from 'react';
import { useEvent } from 'expo';
import ExpoMediapipeFaceDetector, { 
  ExpoMediapipeFaceDetectorView,
  FaceDetectionResult,
  FaceDetectorConfig,
  detectFaces,
  useFaceDetection 
} from 'expo-mediapipe-face-detector';
import { 
  Button, 
  SafeAreaView, 
  ScrollView, 
  Text, 
  View, 
  StyleSheet, 
  Switch, 
  Alert 
} from 'react-native';

export default function App() {
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(true);
  const [detectionResults, setDetectionResults] = useState<FaceDetectionResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Listen for face detection events
  const onFaceDetected = useEvent(ExpoMediapipeFaceDetector, 'onFaceDetected');
  const onError = useEvent(ExpoMediapipeFaceDetector, 'onError');

  useEffect(() => {
    initializeDetector();
  }, []);

  useEffect(() => {
    if (onFaceDetected) {
      setDetectionResults(onFaceDetected);
    }
  }, [onFaceDetected]);

  useEffect(() => {
    if (onError) {
      Alert.alert('Face Detection Error', onError.message);
    }
  }, [onError]);

  const initializeDetector = async () => {
    try {
      const config: FaceDetectorConfig = {
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        maxNumFaces: 2,
        enableFaceLandmarks: true,
        runningMode: 'LIVE_STREAM'
      };
      
      await ExpoMediapipeFaceDetector.initializeDetector(config);
      setIsInitialized(ExpoMediapipeFaceDetector.isInitialized());
    } catch (error) {
      Alert.alert('Initialization Error', `Failed to initialize: ${error}`);
    }
  };

  const handleImageDetection = async () => {
    try {
      // Example with a sample image URL
      const result = await ExpoMediapipeFaceDetector.detectFacesInImage(
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
      );
      setDetectionResults(result);
      Alert.alert('Detection Complete', `Found ${result.faces.length} face(s)`);
    } catch (error) {
      Alert.alert('Detection Error', `${error}`);
    }
  };

  const handleFaceDetection = (event: { nativeEvent: FaceDetectionResult }) => {
    setDetectionResults(event.nativeEvent);
  };

  const detectorConfig: FaceDetectorConfig = {
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5,
    maxNumFaces: 3,
    enableFaceLandmarks: true,
    runningMode: 'LIVE_STREAM'
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>MediaPipe Face Detector</Text>
        
        <Group name="Initialization Status">
          <Text style={styles.statusText}>
            Status: {isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
          </Text>
        </Group>

        <Group name="Camera Detection">
          <View style={styles.switchContainer}>
            <Text>Enable Detection: </Text>
            <Switch
              value={isDetectionEnabled}
              onValueChange={setIsDetectionEnabled}
            />
          </View>
          
          <ExpoMediapipeFaceDetectorView
            config={detectorConfig}
            enabled={isDetectionEnabled}
            onFaceDetected={handleFaceDetection}
            style={styles.cameraView}
          />
        </Group>

        <Group name="Image Detection">
          <Button
            title="Detect Faces in Sample Image"
            onPress={handleImageDetection}
            disabled={!isInitialized}
          />
        </Group>

        <Group name="Detection Results">
          {detectionResults ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                Faces Found: {detectionResults.faces.length}
              </Text>
              <Text style={styles.resultsSubtitle}>
                Image Size: {detectionResults.imageWidth}x{detectionResults.imageHeight}
              </Text>
              
              {detectionResults.faces.map((face, index) => (
                <View key={index} style={styles.faceResult}>
                  <Text style={styles.faceTitle}>Face {index + 1}</Text>
                  <Text>Confidence: {face.confidence.toFixed(2)}</Text>
                  <Text>
                    Bounding Box: ({face.boundingBox.x.toFixed(0)}, {face.boundingBox.y.toFixed(0)}) 
                    {face.boundingBox.width.toFixed(0)}x{face.boundingBox.height.toFixed(0)}
                  </Text>
                  <Text>Landmarks: {face.landmarks.length}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noResults}>No detection results yet</Text>
          )}
        </Group>

        <Group name="Module Info">
          <Button
            title="Get Supported Features"
            onPress={async () => {
              try {
                const features = await ExpoMediapipeFaceDetector.getSupportedFeatures();
                Alert.alert('Supported Features', features.join(', '));
              } catch (error) {
                Alert.alert('Error', `${error}`);
              }
            }}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  group: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#495057',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraView: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  resultsContainer: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 6,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  faceResult: {
    backgroundColor: '#fff',
    padding: 8,
    marginTop: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  faceTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  noResults: {
    fontStyle: 'italic',
    color: '#6c757d',
    textAlign: 'center',
    padding: 20,
  },
});
