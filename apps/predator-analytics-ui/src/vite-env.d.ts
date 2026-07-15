/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Типізація для GLSL шейдерів (vite-plugin-glsl)
declare module '*.glsl' {
  const value: string;
  export default value;
}

declare module '*.vert.glsl' {
  const value: string;
  export default value;
}

declare module '*.frag.glsl' {
  const value: string;
  export default value;
}
