import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'mujichul-dojangpan',
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: 'light',
  },
  webBundleDir: 'dist',
});
