import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/bundle.cjs.js', format: 'cjs' },
    { file: 'dist/bundle.es.js', format: 'es' },
  ],
  plugins: [
    resolve({
      // module: true, // Default: true
      // jsnext: true, // Default: false
      // main: true, // Default: true
      extensions: ['.js'], // Default: ['.js']
      // Lock the module search in this path (like a chroot). Module defined
      // outside this path will be mark has external
      // jail: './', // Default: '/'
      // If true, inspect resolved files to check that they are
      // ES2015 modules
      // modulesOnly: true, // Default: false
    }),
    babel({
      babelrc: false,
      presets: [
        [
          'env',
          {
            modules: false,
            targets: {
              node: '6.10',
            },
          },
        ],
      ],
    }),
  ],
  external: ['fs', 'child_process', 'net', 'http', 'path', 'chrome-launcher'],
}
