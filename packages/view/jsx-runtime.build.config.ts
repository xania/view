import typescript from 'rollup-plugin-typescript';

export default {
  input: ['./jsx-runtime/jsx-runtime.ts', './jsx-runtime/jsx-dev-runtime.ts'],
  external: ['@xania/view'],
  output: {
    dir: './dist/',
    format: 'es',
  },
  plugins: [typescript()],
};
