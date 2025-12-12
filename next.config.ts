import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
  /* config options here */
};

export default withPayload(nextConfig);