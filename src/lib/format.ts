export const LEVEL_COLORS: Record<string, string> = {
	debug: 'gray',
	info: 'blue',
	warn: 'yellow',
	error: 'red',
};

export function formatTime(timestamp: string | number): string {
	const d = new Date(timestamp);
	const h = String(d.getHours()).padStart(2, '0');
	const m = String(d.getMinutes()).padStart(2, '0');
	const s = String(d.getSeconds()).padStart(2, '0');
	const ms = String(d.getMilliseconds()).padStart(3, '0');
	return `${h}:${m}:${s}.${ms}`;
}
