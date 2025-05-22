import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.micuentacuentos.app',
  appName: 'Mi Cuenta Cuentos',
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