import ExpoModulesCore
import MediaPipeTasksVision
import UIKit
import AVFoundation

public class ExpoMediapipeFaceDetectorModule: Module {
  private var faceDetector: FaceDetector?
  private var isInitialized = false
  private var currentConfig: FaceDetectorOptions?
  
  public func definition() -> ModuleDefinition {
    Name("ExpoMediapipeFaceDetector")

    // Events that can be sent to JavaScript
    Events("onFaceDetected", "onError")

    // Initialize the face detector with configuration
    AsyncFunction("initializeDetector") { (config: [String: Any]?) -> Void in
      try await self.initializeFaceDetector(config: config)
    }
    
    // Update detector configuration
    AsyncFunction("updateConfig") { (config: [String: Any]) -> Void in
      try await self.updateDetectorConfig(config: config)
    }
    
    // Detect faces in an image from URI
    AsyncFunction("detectFacesInImage") { (imageUri: String) -> [String: Any] in
      return try await self.detectFacesInImage(imageUri: imageUri)
    }
    
    // Detect faces in base64 encoded image
    AsyncFunction("detectFacesInBase64") { (base64Image: String) -> [String: Any] in
      return try await self.detectFacesInBase64(base64Image: base64Image)
    }
    
    // Process frame for Vision Camera integration
    AsyncFunction("processFrame") { (frameData: [String: Any]) -> [String: Any] in
      return try await self.processFrame(frameData: frameData)
    }
    
    // Start continuous detection
    AsyncFunction("startDetection") { () -> Void in
      // Implementation for starting continuous detection if needed
    }
    
    // Stop continuous detection
    AsyncFunction("stopDetection") { () -> Void in
      // Implementation for stopping continuous detection if needed
    }
    
    // Check if detector is initialized
    Function("isInitialized") {
      return self.isInitialized
    }
    
    // Get supported features
    AsyncFunction("getSupportedFeatures") { () -> [String] in
      return ["FACE_DETECTION", "FACE_LANDMARKS", "BOUNDING_BOX"]
    }

    // Native view for camera integration
    View(ExpoMediapipeFaceDetectorView.self) {
      Prop("config") { (view: ExpoMediapipeFaceDetectorView, config: [String: Any]?) in
        view.updateConfig(config: config)
      }
      
      Prop("enabled") { (view: ExpoMediapipeFaceDetectorView, enabled: Bool) in
        view.setEnabled(enabled: enabled)
      }

      Events("onFaceDetected", "onError")
    }
  }
  
  // MARK: - Private Methods
  
  private func initializeFaceDetector(config: [String: Any]?) async throws {
    let options = FaceDetectorOptions()
    
    if let config = config {
      options.minDetectionConfidence = config["minDetectionConfidence"] as? Float ?? 0.5
      options.minSuppressionThreshold = config["minTrackingConfidence"] as? Float ?? 0.5
      
      if let runningMode = config["runningMode"] as? String {
        switch runningMode {
        case "IMAGE":
          options.runningMode = .image
        case "VIDEO":
          options.runningMode = .video
        case "LIVE_STREAM":
          options.runningMode = .liveStream
        default:
          options.runningMode = .image
        }
      }
    }
    
    // Create detector on main thread
    await MainActor.run {
      do {
        let modelPath = getModelPath()
        options.baseOptions.modelAssetPath = modelPath
        self.faceDetector = try FaceDetector(options: options)
        self.currentConfig = options
        self.isInitialized = true
      } catch {
        self.sendEvent("onError", [
          "message": "Failed to initialize face detector: \(error.localizedDescription)",
          "code": "INITIALIZATION_ERROR"
        ])
      }
    }
  }
  
  private func updateDetectorConfig(config: [String: Any]) async throws {
    try await initializeFaceDetector(config: config)
  }
  
  private func detectFacesInImage(imageUri: String) async throws -> [String: Any] {
    guard let detector = faceDetector, isInitialized else {
      throw NSError(domain: "FaceDetector", code: -1, userInfo: [NSLocalizedDescriptionKey: "Face detector not initialized"])
    }
    
    let url = URL(string: imageUri)!
    let data = try Data(contentsOf: url)
    guard let uiImage = UIImage(data: data) else {
      throw NSError(domain: "FaceDetector", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])
    }
    
    let mpImage = try MPImage(uiImage: uiImage)
    let result = try detector.detect(image: mpImage)
    
    return formatDetectionResult(result: result, imageSize: uiImage.size)
  }
  
  private func detectFacesInBase64(base64Image: String) async throws -> [String: Any] {
    guard let detector = faceDetector, isInitialized else {
      throw NSError(domain: "FaceDetector", code: -1, userInfo: [NSLocalizedDescriptionKey: "Face detector not initialized"])
    }
    
    guard let data = Data(base64Encoded: base64Image),
          let uiImage = UIImage(data: data) else {
      throw NSError(domain: "FaceDetector", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 image data"])
    }
    
    let mpImage = try MPImage(uiImage: uiImage)
    let result = try detector.detect(image: mpImage)
    
    return formatDetectionResult(result: result, imageSize: uiImage.size)
  }
  
  private func processFrame(frameData: [String: Any]) async throws -> [String: Any] {
    guard faceDetector != nil, isInitialized else {
      throw NSError(domain: "FaceDetector", code: -1, userInfo: [NSLocalizedDescriptionKey: "Face detector not initialized"])
    }
    
    // This would be implemented to work with Vision Camera frame data
    // For now, return empty result
    return [
      "faces": [],
      "imageWidth": frameData["width"] ?? 0,
      "imageHeight": frameData["height"] ?? 0,
      "timestamp": Date().timeIntervalSince1970 * 1000
    ]
  }
  
  private func formatDetectionResult(result: FaceDetectorResult, imageSize: CGSize) -> [String: Any] {
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
            "type": getLandmarkType(keypoint: keypoint),
            "position": [
              "x": keypoint.location.x,
              "y": keypoint.location.y,
              "z": 0.0 // MediaPipe iOS face detection provides 2D coordinates
            ]
          ])
        }
      }
      face["landmarks"] = landmarks
      
      faces.append(face)
    }
    
    return [
      "faces": faces,
      "imageWidth": imageSize.width,
      "imageHeight": imageSize.height,
      "timestamp": Date().timeIntervalSince1970 * 1000
    ]
  }
  
  private func getLandmarkType(keypoint: NormalizedKeypoint) -> String {
    // Map MediaPipe keypoint indices to landmark types
    // This is a simplified mapping - you'd need to implement the full MediaPipe face landmark mapping
    return "UNKNOWN"
  }
  
  private func getModelPath() -> String {
    // Return path to MediaPipe face detection model from the resource bundle
    guard let bundle = Bundle(for: ExpoMediapipeFaceDetectorModule.self),
          let bundleURL = bundle.url(forResource: "ExpoMediapipeFaceDetectorModels", withExtension: "bundle"),
          let resourceBundle = Bundle(url: bundleURL),
          let modelPath = resourceBundle.path(forResource: "face_detection_short_range", ofType: "tflite") else {
      // Fallback to main bundle for development/testing
      guard let mainBundlePath = Bundle.main.path(forResource: "face_detection_short_range", ofType: "tflite") else {
        fatalError("Face detection model not found in resource bundle or main bundle")
      }
      return mainBundlePath
    }
    return modelPath
  }
}
