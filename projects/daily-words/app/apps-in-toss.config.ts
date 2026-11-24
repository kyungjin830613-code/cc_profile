import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'haru-eng-word',
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: 'light',
  },
  webBundleDir: 'dist',
});
