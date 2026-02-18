import Pastel from 'pastel';

const app = new Pastel({
	importMeta: import.meta,
	name: 'timberlogs',
});

await app.run();
