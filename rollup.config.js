import typescript from 'rollup-plugin-typescript2'


export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/tinymde.js', format: 'umd', name: 'tinymde', sourcemap: true },
  ],
  plugins:[
    typescript({
      removeComments: true,
      useTsconfigDeclarationDir: true,
    })
  ],
}