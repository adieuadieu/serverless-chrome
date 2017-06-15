import resolve from 'rollup-plugin-node-resolve'
// import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  targets: [{ dest: 'dist/index.js', format: 'cjs' }, { dest: 'dist/index.es.js', format: 'es' }],
  sourceMap: true,
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
    babel({}),
  ],
  external: ['path', 'globby', 'fs-p'],
}
