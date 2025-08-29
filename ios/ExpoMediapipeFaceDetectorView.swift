import ExpoModulesCore
import UIKit
import AVFoundation
import MediaPipeTasksVision

// This view will be used as a native component for face detection preview
class ExpoMediapipeFaceDetectorView: ExpoView {
  private let previewLayer = AVCaptureVideoPreviewLayer()
  private let onFaceDetected = EventDispatcher()
  private let onError = EventDispatcher()
  
  private var captureSession: AVCaptureSession?
  private var videoOutput: AVCaptureVideoDataOutput?
  private var faceDetector: FaceDetector?
  private var isEnabled = true
  private var currentConfig: [String: Any]?
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupPreviewLayer()
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    previewLayer.frame = bounds
  }
  
  // MARK: - Public Methods
  
  func updateConfig(config: [String: Any]?) {
    currentConfig = config
    setupFaceDetector()
  }
  
  func setEnabled(enabled: Bool) {
    isEnabled = enabled
    if enabled {
      startCamera()
    } else {
      stopCamera()
    }
  }
  
  // MARK: - Private Methods
  
  private func setupPreviewLayer() {
    previewLayer.videoGravity = .resizeAspectFill
    layer.addSublayer(previewLayer)
  }
  
  private func setupFaceDetector() {
    do {
      let options = FaceDetectorOptions()
      
      if let config = currentConfig {
        options.minDetectionConfidence = config["minDetectionConfidence"] as? Float ?? 0.5
        options.minSuppressionThreshold = config["minTrackingConfidence"] as? Float ?? 0.5
        options.runningMode = .liveStream
        
        // Set up result callback for live stream mode
        options.faceDetectorLiveStreamDelegate = self
      }
      
      // Set model path
      if let modelPath = Bundle.main.path(forResource: "face_detection_short_range", ofType: "tflite") {
        options.baseOptions.modelAssetPath = modelPath
      }
      
      faceDetector = try FaceDetector(options: options)
    } catch {
      onError([
        "message": "Failed to initialize face detector: \(error.localizedDescription)",
        "code": "INITIALIZATION_ERROR"
      ])
    }
  }
  
  private func startCamera() {
    guard isEnabled else { return }
    
    captureSession = AVCaptureSession()
    guard let captureSession = captureSession else { return }
    
    captureSession.beginConfiguration()
    captureSession.sessionPreset = .high
    
    // Add camera input
    guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
          let input = try? AVCaptureDeviceInput(device: camera) else {
      onError([
        "message": "Failed to access camera",
        "code": "CAMERA_ACCESS_ERROR"
      ])
      return
    }
    
    if captureSession.canAddInput(input) {
      captureSession.addInput(input)
    }
    
    // Add video output
    videoOutput = AVCaptureVideoDataOutput()
    guard let videoOutput = videoOutput else { return }
    
    videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "camera.frame.processing.queue"))
    videoOutput.alwaysDiscardsLateVideoFrames = true
    videoOutput.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]
    
    if captureSession.canAddOutput(videoOutput) {
      captureSession.addOutput(videoOutput)
    }
    
    previewLayer.session = captureSession
    captureSession.commitConfiguration()
    
    DispatchQueue.global(qos: .userInitiated).async {
      captureSession.startRunning()
    }
  }
  
  private func stopCamera() {
    captureSession?.stopRunning()
    captureSession = nil
    videoOutput = nil
  }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate

extension ExpoMediapipeFaceDetectorView: AVCaptureVideoDataOutputSampleBufferDelegate {
  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard isEnabled, let faceDetector = faceDetector else { return }
    
    do {
      let mpImage = try MPImage(sampleBuffer: sampleBuffer)
      let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
      let timestampMs = Int(CMTimeGetSeconds(timestamp) * 1000)
      
      // Detect faces asynchronously
      try faceDetector.detectAsync(image: mpImage, timestampInMilliseconds: timestampMs)
    } catch {
      DispatchQueue.main.async {
        self.onError([
          "message": "Face detection error: \(error.localizedDescription)",
          "code": "DETECTION_ERROR"
        ])
      }
    }
  }
}

// MARK: - FaceDetectorLiveStreamDelegate

extension ExpoMediapipeFaceDetectorView: FaceDetectorLiveStreamDelegate {
  func faceDetector(_ faceDetector: FaceDetector, didFinishDetection result: FaceDetectorResult?, timestampInMilliseconds: Int, error: Error?) {
    if let error = error {
      DispatchQueue.main.async {
        self.onError([
          "message": "Face detection error: \(error.localizedDescription)",
          "code": "DETECTION_ERROR"
        ])
      }
      return
    }
    
    guard let result = result else { return }
    
    DispatchQueue.main.async {
      let formattedResult = self.formatDetectionResult(result: result, timestamp: timestampInMilliseconds)
      self.onFaceDetected(formattedResult)
    }
  }
  
  private func formatDetectionResult(result: FaceDetectorResult, timestamp: Int) -> [String: Any] {
    var faces: [[String: Any]] = []
    
    for detection in result.detections {
      var face: [String: Any] = [:]
      
      // Bounding box
      let boundingBox = detection.boundingBox
      face["boundingBox"] = [
        "x": boundingBox.origin.x,
        "y": boundingBox.origin.y,
        "width": boundingBox.size.width,
        "height": boundingBox.size.height
      ]
      
      // Confidence
      if let category = detection.categories.first {
        face["confidence"] = category.score
      }
      
      // Landmarks (if available)
      var landmarks: [[String: Any]] = []
      if let keypoints = detection.keypoints {
        for keypoint in keypoints {
          landmarks.append([
            "type": "UNKNOWN", // You'd implement proper landmark type mapping here
            "position": [
              "x": keypoint.location.x,
              "y": keypoint.location.y,
              "z": keypoint.location.z ?? 0
            ]
          ])
        }
      }
      face["landmarks"] = landmarks
      
      faces.append(face)
    }
    
    return [
      "faces": faces,
      "imageWidth": bounds.width,
      "imageHeight": bounds.height,
      "timestamp": timestamp
    ]
  }
}
