import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   output: "standalone",

  webpack(config) {
    config.resolve.fallback = {

      // if you miss it, all the other options in fallback, specified
      // by next.js will be dropped.
      ...config.resolve.fallback,  

      fs: false, // the solution
    };
    
    return config;
  },
   
};

export default nextConfig;
