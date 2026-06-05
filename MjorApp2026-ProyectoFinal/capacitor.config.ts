import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mjorteam.mjorapp',
  appName: 'MjorApp',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    },
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#b7a3ee',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    "CapacitorCookies":{
      enabled: true,
    },
    CapacitorHttp: 
    {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
