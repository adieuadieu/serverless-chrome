import resolve from 'rollup-plugin-node-resolve'
// import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.js',
  output: [{ file: 'dist/index.js', format: 'cjs' }, { file: 'dist/index.es.js', format: 'es' }],
  sourcemap: true,
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
    // commonjs({}),
    babel({
      babelrc: false,
      plugins: ['transform-object-rest-spread'],
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
  external: ['path', 'globby', 'fs-p'],
}
