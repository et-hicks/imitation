import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/__tests__/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next'],
        globals: true,
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/__tests__/']
        },
        // Don't process CSS for tests
        css: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    // Disable CSS processing entirely
    css: {
        postcss: '',
    }
})
