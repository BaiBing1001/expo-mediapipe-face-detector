import { registerWebModule, NativeModule } from 'expo';

import { ExpoMediapipeFaceDetectorModuleEvents } from './ExpoMediapipeFaceDetector.types';

class ExpoMediapipeFaceDetectorModule extends NativeModule<ExpoMediapipeFaceDetectorModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoMediapipeFaceDetectorModule, 'ExpoMediapipeFaceDetectorModule');
