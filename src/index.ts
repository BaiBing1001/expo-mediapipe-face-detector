// Reexport the native module. On web, it will be resolved to ExpoMediapipeFaceDetectorModule.web.ts
// and on native platforms to ExpoMediapipeFaceDetectorModule.ts
export { default } from './ExpoMediapipeFaceDetectorModule';
export { default as ExpoMediapipeFaceDetectorView } from './ExpoMediapipeFaceDetectorView';
export * from  './ExpoMediapipeFaceDetector.types';
