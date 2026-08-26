import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b485f415001e400581b9273bffe4427a',
  appName: 'flymasters-hybrid-application',
  webDir: 'dist',
  server: {
    url: 'https://b485f415-001e-4005-81b9-273bffe4427a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4F46E5',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#4F46E5',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    }
  }
};

export default config;