import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.audiogretel.app',
  appName: 'AudioGretel',
  webDir: 'build',
  server: {
    hostname: '10.0.2.2',
    androidScheme: 'http',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config; 