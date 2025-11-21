const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DATA_PATH = path.join(ROOT_DIR, 'db.json');
const CONTENT_TTL = 60 * 1000; // 1 minuto

let cachedContent = null;
let cachedAt = 0;

async function readContent() {
	if (cachedContent && Date.now() - cachedAt < CONTENT_TTL) {
		return cachedContent;
	}
	try {
		const raw = await fsp.readFile(DATA_PATH, 'utf-8');
		cachedContent = JSON.parse(raw);
		cachedAt = Date.now();
		return cachedContent;
	} catch (error) {
		cachedContent = null;
		cachedAt = 0;
		throw new Error(`Erro ao ler conteúdo: ${error.message}`);
	}
}

function clearContentCache() {
	cachedContent = null;
	cachedAt = 0;
}

try {
	fs.watch(DATA_PATH, { persistent: false }, () => {
		clearContentCache();
	});
} catch (error) {
	console.warn('Watcher de conteúdo indisponível:', error.message);
}

module.exports = {
	readContent,
	clearContentCache
};
