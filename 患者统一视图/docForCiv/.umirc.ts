import { defineConfig } from 'dumi';

export default defineConfig({
  title: '患者统一视图指导手册',
  devServer: {
    port: 2089
  },
  mode: 'site',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo: '/docForCiv/images/loginIconLogo.png',
  outputPath: 'docs-dist',
  base: '/docForCiv/',
  publicPath: '/docForCiv/',
  // more config: https://d.umijs.org/config
  hash: true,
});
