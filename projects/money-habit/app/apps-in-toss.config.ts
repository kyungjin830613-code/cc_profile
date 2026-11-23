import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'money-habit',
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: 'light',
  },
  webBundleDir: 'dist',
});
