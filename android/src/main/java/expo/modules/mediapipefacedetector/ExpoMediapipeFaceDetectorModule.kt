package expo.modules.mediapipefacedetector

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facedetector.FaceDetector
import com.google.mediapipe.tasks.vision.facedetector.FaceDetectorOptions
import com.google.mediapipe.tasks.vision.facedetector.FaceDetectorResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.URL

class ExpoMediapipeFaceDetectorModule : Module() {
  private var faceDetector: FaceDetector? = null
  private var isInitialized = false
  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context is null")

  override fun definition() = ModuleDefinition {
    Name("ExpoMediapipeFaceDetector")

    Events("onFaceDetected", "onError")

    // Initialize the face detector with configuration
    AsyncFunction("initializeDetector") { config: Map<String, Any>? ->
      initializeFaceDetector(config)
    }

    // Update detector configuration
    AsyncFunction("updateConfig") { config: Map<String, Any> ->
      updateDetectorConfig(config)
    }

    // Detect faces in an image from URI
    AsyncFunction("detectFacesInImage") { imageUri: String ->
      detectFacesInImage(imageUri)
    }

    // Detect faces in base64 encoded image
    AsyncFunction("detectFacesInBase64") { base64Image: String ->
      detectFacesInBase64(base64Image)
    }

    // Process frame for Vision Camera integration
    AsyncFunction("processFrame") { frameData: Map<String, Any> ->
      processFrame(frameData)
    }

    // Start continuous detection
    AsyncFunction("startDetection") {
      // Implementation for starting continuous detection if needed
    }

    // Stop continuous detection
    AsyncFunction("stopDetection") {
      // Implementation for stopping continuous detection if needed
    }

    // Check if detector is initialized
    Function("isInitialized") {
      isInitialized
    }

    // Get supported features
    AsyncFunction("getSupportedFeatures") {
      listOf("FACE_DETECTION", "FACE_LANDMARKS", "BOUNDING_BOX")
    }

    // Native view for camera integration
    View(ExpoMediapipeFaceDetectorView::class) {
      Prop("config") { view: ExpoMediapipeFaceDetectorView, config: Map<String, Any>? ->
        view.updateConfig(config)
      }

      Prop("enabled") { view: ExpoMediapipeFaceDetectorView, enabled: Boolean ->
        view.setEnabled(enabled)
      }

      Events("onFaceDetected", "onError")
    }
  }

  private suspend fun initializeFaceDetector(config: Map<String, Any>?) {
    try {
      val optionsBuilder = FaceDetectorOptions.builder()

      // Configure detection parameters
      config?.let {
        val minDetectionConfidence = it["minDetectionConfidence"] as? Double ?: 0.5
        val minSuppressionThreshold = it["minTrackingConfidence"] as? Double ?: 0.5
        
        optionsBuilder.setMinDetectionConfidence(minDetectionConfidence.toFloat())
        optionsBuilder.setMinSuppressionThreshold(minSuppressionThreshold.toFloat())

        val runningMode = it["runningMode"] as? String ?: "IMAGE"
        when (runningMode) {
          "IMAGE" -> optionsBuilder.setRunningMode(RunningMode.IMAGE)
          "VIDEO" -> optionsBuilder.setRunningMode(RunningMode.VIDEO)
          "LIVE_STREAM" -> optionsBuilder.setRunningMode(RunningMode.LIVE_STREAM)
        }
      }

      // Set base options with model
      val baseOptionsBuilder = BaseOptions.builder()
      val modelPath = getModelPath()
      baseOptionsBuilder.setModelAssetPath(modelPath)
      optionsBuilder.setBaseOptions(baseOptionsBuilder.build())

      faceDetector = FaceDetector.createFromOptions(context, optionsBuilder.build())
      isInitialized = true

    } catch (e: Exception) {
      sendEvent("onError", mapOf(
        "message" to "Failed to initialize face detector: ${e.message}",
        "code" to "INITIALIZATION_ERROR"
      ))
      throw e
    }
  }

  private suspend fun updateDetectorConfig(config: Map<String, Any>) {
    initializeFaceDetector(config)
  }

  private suspend fun detectFacesInImage(imageUri: String): Map<String, Any> {
    val detector = faceDetector ?: throw Exception("Face detector not initialized")

    try {
      val url = URL(imageUri)
      val inputStream: InputStream = url.openConnection().getInputStream()
      val bitmap = BitmapFactory.decodeStream(inputStream)
        ?: throw Exception("Failed to decode image from URI")

      val mpImage = BitmapImageBuilder(bitmap).build()
      val result = detector.detect(mpImage)

      return formatDetectionResult(result, bitmap.width, bitmap.height)

    } catch (e: Exception) {
      throw Exception("Face detection failed: ${e.message}")
    }
  }

  private suspend fun detectFacesInBase64(base64Image: String): Map<String, Any> {
    val detector = faceDetector ?: throw Exception("Face detector not initialized")

    try {
      val imageBytes = Base64.decode(base64Image, Base64.DEFAULT)
      val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
        ?: throw Exception("Failed to decode base64 image")

      val mpImage = BitmapImageBuilder(bitmap).build()
      val result = detector.detect(mpImage)

      return formatDetectionResult(result, bitmap.width, bitmap.height)

    } catch (e: Exception) {
      throw Exception("Face detection failed: ${e.message}")
    }
  }

  private suspend fun processFrame(frameData: Map<String, Any>): Map<String, Any> {
    val detector = faceDetector ?: throw Exception("Face detector not initialized")

    // This would be implemented to work with Vision Camera frame data
    // For now, return empty result
    return mapOf(
      "faces" to emptyList<Map<String, Any>>(),
      "imageWidth" to (frameData["width"] ?: 0),
      "imageHeight" to (frameData["height"] ?: 0),
      "timestamp" to System.currentTimeMillis()
    )
  }

  private fun formatDetectionResult(result: FaceDetectorResult, imageWidth: Int, imageHeight: Int): Map<String, Any> {
    val faces = result.detections().map { detection ->
      val boundingBox = detection.boundingBox()
      
      mapOf(
        "boundingBox" to mapOf(
          "x" to boundingBox.left,
          "y" to boundingBox.top,
          "width" to boundingBox.width(),
          "height" to boundingBox.height()
        ),
        "confidence" to (detection.categories().firstOrNull()?.score() ?: 0.0f),
        "landmarks" to (detection.keypoints()?.map { keypoint ->
          mapOf(
            "type" to "UNKNOWN", // Implement proper landmark type mapping
            "position" to mapOf(
              "x" to keypoint.x(),
              "y" to keypoint.y(),
              "z" to (keypoint.z() ?: 0.0f)
            )
          )
        } ?: emptyList<Map<String, Any>>())
      )
    }

    return mapOf(
      "faces" to faces,
      "imageWidth" to imageWidth,
      "imageHeight" to imageHeight,
      "timestamp" to System.currentTimeMillis()
    )
  }

  private fun getModelPath(): String {
    // Return path to MediaPipe face detection model in assets
    return "face_detection_short_range.tflite"
  }
}
