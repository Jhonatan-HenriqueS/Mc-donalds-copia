import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ hostname: "u9a6wmr3as.ufs.sh" }],
    // Diz pro next que as imagens que tiver esse domínio serão validadas
  },
};

export default nextConfig;
