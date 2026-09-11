import path from "node:path";
import { fileURLToPath } from "node:url";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// Makes Cloudflare bindings (env, ctx) available during `next dev`
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
	outputFileTracingRoot: path.join(
		fileURLToPath(new URL(".", import.meta.url)),
	),
};

export default nextConfig;
