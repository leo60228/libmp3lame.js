import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fsCallbacks from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const fs = fsCallbacks.promises;

const cwd = dirname(fileURLToPath(import.meta.url));

const config = async (env) => {
  const exampleDir = resolve(cwd, env.EXAMPLE);
  const hasHtml = await fs.access(resolve(exampleDir, 'index.html')).then(() => true, () => false);
  return {
    mode: 'development',
    entry: resolve(exampleDir, 'index.js'),
    output: {
      path: resolve(exampleDir, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.html$/i,
          loader: 'html-loader'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        ...(hasHtml && {template: resolve(exampleDir, 'index.html')})
      })
    ],
    devServer: {
      open: 'firefox'
    },
    stats: {
      children: true
    }
  };
};

export default config;
