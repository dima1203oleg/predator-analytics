/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_FIGMA_FILE_URL?: string;
    readonly VITE_FIGMA_FILE_KEY?: string;
    readonly VITE_FIGMA_FILE_NAME?: string;
    readonly VITE_FIGMA_SYNCED_AT?: string;
}
