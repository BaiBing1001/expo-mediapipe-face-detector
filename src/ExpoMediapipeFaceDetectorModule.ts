import { NativeModule, requireNativeModule } from 'expo';

import { ExpoMediapipeFaceDetectorModuleEvents } from './ExpoMediapipeFaceDetector.types';

declare class ExpoMediapipeFaceDetectorModule extends NativeModule<ExpoMediapipeFaceDetectorModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoMediapipeFaceDetectorModule>('ExpoMediapipeFaceDetector');
