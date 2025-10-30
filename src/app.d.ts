// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		electronAPI?: {
			platform: string;
			version: string;
			checkForUpdates: () => Promise<{
				available?: boolean;
				version?: string;
				error?: string;
				message?: string;
			}>;
			downloadUpdate: () => Promise<{
				success?: boolean;
				error?: string;
				message?: string;
			}>;
			installUpdate: () => Promise<{
				success?: boolean;
				message?: string;
			}>;
			getAppVersion: () => Promise<string>;
			onUpdateChecking: (callback: () => void) => () => void;
			onUpdateAvailable: (
				callback: (info: {
					version: string;
					releaseDate?: string;
					releaseNotes?: string;
				}) => void
			) => () => void;
			onUpdateNotAvailable: (callback: () => void) => () => void;
			onUpdateError: (callback: (error: { message: string }) => void) => () => void;
			onUpdateDownloadProgress: (
				callback: (progress: { percent: number; transferred: number; total: number }) => void
			) => () => void;
			onUpdateDownloaded: (callback: () => void) => () => void;
		};
	}
}

export {};
