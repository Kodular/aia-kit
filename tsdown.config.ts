import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'index':                      'src/index.ts',
    'aia/index':                  'src/aia/index.ts',
    'ais/index':                  'src/ais/index.ts',
    'aix/index':                  'src/aix/index.ts',
    'analysis/index':             'src/analysis/index.ts',
    'bky/index':                  'src/bky/index.ts',
    'component-descriptor/index': 'src/component-descriptor/index.ts',
    'environment/index':          'src/environment/index.ts',
    'model/index':                'src/model/index.ts',
    'project-properties/index':   'src/project-properties/index.ts',
    'scm/index':                  'src/scm/index.ts',
    'yail/index':                 'src/yail/index.ts',
  },
  outDir: 'dist',
  format: 'esm',
  dts: true,
  splitting: true,
  deps: {
    neverBundle: [
      '@zip.js/zip.js',
      '@xmldom/xmldom',
      'properties-file',
      'zod',
    ],
  },
  alias: {
    '#/': new URL('./src/', import.meta.url).pathname,
  },
})
