/// <reference types="vite/client" />
declare module 'vite-plugin-glsl';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      quantumMaterial: any;
    }
  }
}
