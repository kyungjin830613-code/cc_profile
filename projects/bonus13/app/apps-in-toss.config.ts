import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'bonus13',
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: 'light',
  },
  webBundleDir: 'dist',
});
