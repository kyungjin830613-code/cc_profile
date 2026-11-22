import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'chaltteok-wallet',
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: 'light',
  },
  webBundleDir: 'dist',
});
