import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from 'flowbite-react/plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), flowbiteReact()],
  // uncomment untuk jadikan satu chunk lucide react, fungsinya buat cek npm run build
  // jangan uncomment dibawah ini kalau tidak perlu
  
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks(id) {
  //         if (id.includes('lucide-react')) {
  //           return 'lucide-icons';
  //         }
  //       }
  //     }
  //   }
  // }
})
