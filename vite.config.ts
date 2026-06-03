import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

function resolveDevPort(appUrl: string | undefined): number {
	const fallback = 5173;

	if (!appUrl?.trim()) {
		return fallback;
	}

	try {
		const url = new URL(appUrl);
		if (url.port) {
			return Number(url.port);
		}

		if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
			return fallback;
		}

		return url.protocol === 'https:' ? 443 : 80;
	} catch {
		return fallback;
	}
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const devPort = resolveDevPort(env.APP_URL);

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			port: devPort
		},
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'tests/e2e/**']
					}
				}
			]
		}
	};
});
