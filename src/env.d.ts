/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDGE_TTS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


