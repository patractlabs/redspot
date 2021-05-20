import 'redspot/types/config';

declare module 'redspot/types/config' {
  interface HardhatUserConfig {
    typegen: {
      outDir: string;
    };
  }
}
