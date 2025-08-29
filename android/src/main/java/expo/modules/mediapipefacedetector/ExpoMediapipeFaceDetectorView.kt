package expo.modules.mediapipefacedetector

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.util.Size
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facedetector.FaceDetector
import com.google.mediapipe.tasks.vision.facedetector.FaceDetectorOptions
import com.google.mediapipe.tasks.vision.facedetector.FaceDetectorResult
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ExpoMediapipeFaceDetectorView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onFaceDetected by EventDispatcher()
  private val onError by EventDispatcher()

  private val previewView = PreviewView(context).apply {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
  }

  private var cameraProvider: ProcessCameraProvider? = null
  private var preview: Preview? = null
  private var imageAnalyzer: ImageAnalysis? = null
  private var camera: Camera? = null
  private var faceDetector: FaceDetector? = null
  
  private lateinit var cameraExecutor: ExecutorService
  private var isEnabled = true
  private var currentConfig: Map<String, Any>? = null

  init {
    addView(previewView)
    cameraExecutor = Executors.newSingleThreadExecutor()
    setupFaceDetector()
  }

  fun updateConfig(config: Map<String, Any>?) {
    currentConfig = config
    setupFaceDetector()
  }

  fun setEnabled(enabled: Boolean) {
    isEnabled = enabled
    if (enabled) {
      startCamera()
    } else {
      stopCamera()
    }
  }

  private fun setupFaceDetector() {
    try {
      val optionsBuilder = FaceDetectorOptions.builder()

      currentConfig?.let { config ->
        val minDetectionConfidence = config["minDetectionConfidence"] as? Double ?: 0.5
        val minSuppressionThreshold = config["minTrackingConfidence"] as? Double ?: 0.5
        
        optionsBuilder.setMinDetectionConfidence(minDetectionConfidence.toFloat())
        optionsBuilder.setMinSuppressionThreshold(minSuppressionThreshold.toFloat())
        optionsBuilder.setRunningMode(RunningMode.LIVE_STREAM)
        
        // Set result listener for live stream mode
        optionsBuilder.setResultListener { result, _ ->
          handleDetectionResult(result)
        }
        
        optionsBuilder.setErrorListener { error, _ ->
          onError(mapOf(
            "message" to "Face detection error: ${error.message}",
            "code" to "DETECTION_ERROR"
          ))
        }
      }

      // Set base options with model
      val baseOptionsBuilder = BaseOptions.builder()
      baseOptionsBuilder.setModelAssetPath("face_detection_short_range.tflite")
      optionsBuilder.setBaseOptions(baseOptionsBuilder.build())

      faceDetector = FaceDetector.createFromOptions(context, optionsBuilder.build())

    } catch (e: Exception) {
      onError(mapOf(
        "message" to "Failed to initialize face detector: ${e.message}",
        "code" to "INITIALIZATION_ERROR"
      ))
    }
  }

  private fun startCamera() {
    if (!isEnabled) return

    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    cameraProviderFuture.addListener({
      try {
        cameraProvider = cameraProviderFuture.get()
        bindCameraUseCases()
      } catch (e: Exception) {
        onError(mapOf(
          "message" to "Failed to start camera: ${e.message}",
          "code" to "CAMERA_ERROR"
        ))
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun bindCameraUseCases() {
    val cameraProvider = cameraProvider ?: return
    val lifecycleOwner = context as? LifecycleOwner ?: return

    // Preview use case
    preview = Preview.Builder()
      .setTargetResolution(Size(640, 480))
      .build()
      .also {
        it.setSurfaceProvider(previewView.surfaceProvider)
      }

    // Image analysis use case for face detection
    imageAnalyzer = ImageAnalysis.Builder()
      .setTargetResolution(Size(640, 480))
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .build()
      .also {
        it.setAnalyzer(cameraExecutor) { imageProxy ->
          detectFaces(imageProxy)
        }
      }

    // Select front camera
    val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

    try {
      // Unbind use cases before rebinding
      cameraProvider.unbindAll()

      // Bind use cases to camera
      camera = cameraProvider.bindToLifecycle(
        lifecycleOwner,
        cameraSelector,
        preview,
        imageAnalyzer
      )

    } catch (e: Exception) {
      onError(mapOf(
        "message" to "Failed to bind camera use cases: ${e.message}",
        "code" to "CAMERA_BIND_ERROR"
      ))
    }
  }

  private fun detectFaces(imageProxy: ImageProxy) {
    val detector = faceDetector ?: return

    try {
      val bitmap = imageProxy.toBitmap()
      val mpImage = BitmapImageBuilder(bitmap).build()
      val timestampMs = System.currentTimeMillis()

      detector.detectAsync(mpImage, timestampMs)
    } catch (e: Exception) {
      onError(mapOf(
        "message" to "Face detection error: ${e.message}",
        "code" to "DETECTION_ERROR"
      ))
    } finally {
      imageProxy.close()
    }
  }

  private fun handleDetectionResult(result: FaceDetectorResult) {
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
            "type" to "UNKNOWN",
            "position" to mapOf(
              "x" to keypoint.x(),
              "y" to keypoint.y(),
              "z" to (keypoint.z() ?: 0.0f)
            )
          )
        } ?: emptyList<Map<String, Any>>())
      )
    }

    onFaceDetected(mapOf(
      "faces" to faces,
      "imageWidth" to previewView.width,
      "imageHeight" to previewView.height,
      "timestamp" to System.currentTimeMillis()
    ))
  }

  private fun stopCamera() {
    cameraProvider?.unbindAll()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    cameraExecutor.shutdown()
  }
}
