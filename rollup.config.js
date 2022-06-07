import typescript from 'rollup-plugin-typescript2'

const plugins = [
  typescript({
    tsconfig: 'tsconfig.json',
    removeComments: true,
    useTsconfigDeclarationDir: true,
  })
]

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/tinymde.js', format: 'umd', name: 'tinymde', sourcemap: true },
  ],
  plugins,
}