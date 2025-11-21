const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DATA_PATH = path.join(ROOT_DIR, 'db.json');
const LOG_DIR = path.join(ROOT_DIR, 'logs');
const CONTACT_LOG = path.join(LOG_DIR, 'contacts.log');
const CONTACT_STORE = path.join(ROOT_DIR, 'data', 'contacts.json');
const CONTACT_STORE_DIR = path.dirname(CONTACT_STORE);
const CONTENT_TTL = 60 * 1000; // 1 minuto

let cachedContent = null;
let cachedAt = 0;

async function ensureDirectory(dirPath) {
	await fsp.mkdir(dirPath, { recursive: true });
}

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

async function logContact(payload) {
	await ensureDirectory(LOG_DIR);
	const sections = [
		`${new Date().toISOString()} | ${payload.name} <${payload.email}> | ${payload.subject}`,
		payload.phone ? `Telefone: ${payload.phone}` : null,
		payload.message,
		'---'
	].filter(Boolean);
	const entry = `${sections.join('\n')}\n`;
	await fsp.appendFile(CONTACT_LOG, entry, 'utf-8');
}

async function persistContactRecord(record) {
	await ensureDirectory(CONTACT_STORE_DIR);
	let existing = [];
	try {
		const raw = await fsp.readFile(CONTACT_STORE, 'utf-8');
		existing = raw ? JSON.parse(raw) : [];
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.error('Falha ao ler contato existente:', error.message);
		}
	}
	existing.push(record);
	await fsp.writeFile(CONTACT_STORE, JSON.stringify(existing, null, 2), 'utf-8');
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
	clearContentCache,
	logContact,
	persistContactRecord
};
