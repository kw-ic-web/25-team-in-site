interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_PROXY?: string;
  readonly VITE_HINT_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
