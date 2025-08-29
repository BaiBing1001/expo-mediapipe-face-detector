# MediaPipe Face Detection Models

This directory should contain the MediaPipe face detection model files:

- `face_detection_short_range.tflite` - For close-range face detection
- `face_detection_full_range.tflite` - For full-range face detection (optional)

## Download Models

You can download the official MediaPipe models from:
https://developers.google.com/mediapipe/solutions/vision/face_detector

## Model Usage

The models are automatically bundled with the iOS framework and loaded at runtime.
The default model used is `face_detection_short_range.tflite` which works well for:
- Front-facing camera scenarios
- Close-range face detection (within 2 meters)
- Real-time performance

For longer range detection, you can replace with `face_detection_full_range.tflite`.
