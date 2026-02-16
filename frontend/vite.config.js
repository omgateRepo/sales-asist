import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

process.env.ROLLUP_SKIP_NATIVE = '1'
process.env.ROLLUP_WASM = '1'

export default defineConfig({
  plugins: [react()],
})
