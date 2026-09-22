import { defineConfig } from "vite";

export default defineConfig({
    base: "/",
    build: {
        target: "es2020",
        outDir: "dist",
        assetsInlineLimit: 4096,
        cssCodeSplit: false,
        sourcemap: false,
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/three")) {
                        return "three";
                    }
                    if (
                        id.includes("node_modules/gsap") ||
                        id.includes("node_modules/@gsap")
                    ) {
                        return "gsap";
                    }
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                    return undefined;
                },
            },
        },
    },
    server: {
        open: true,
    },
});
