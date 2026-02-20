export interface ProfileConfig {
	apiKey: string;
}

export interface Config {
	apiKey?: string;
	activeProfile?: string;
	profiles?: Record<string, ProfileConfig>;
}

export const API_URL = 'https://timberlogs-ingest.enaboapps.workers.dev';
