#!/usr/bin/env node
/**
 * Valida se o conteúdo oficial (db.json) está alinhado com o fallback usado no front-end.
 * Útil para evitar divergências entre API e dados embutidos em docs/js/main.js.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const dbPath = path.join(projectRoot, 'db.json');
const mainJsPath = path.join(projectRoot, 'docs', 'js', 'main.js');

function loadJSON(filePath) {
	const payload = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(payload);
}

function extractFallbackObject(source, token) {
	const startTokenIndex = source.indexOf(token);
	if (startTokenIndex === -1) {
		throw new Error('Constante CONTENT_FALLBACK não encontrada em docs/js/main.js.');
	}
	const braceStart = source.indexOf('{', startTokenIndex);
	if (braceStart === -1) {
		throw new Error('Não foi possível localizar o início do objeto CONTENT_FALLBACK.');
	}
	let depth = 0;
	let inString = false;
	let stringDelimiter = null;
	let result = '';
	for (let i = braceStart; i < source.length; i += 1) {
		const char = source[i];
		const prev = source[i - 1];
		result += char;
		if (inString) {
			if (char === stringDelimiter && prev !== '\\') {
				inString = false;
				stringDelimiter = null;
			}
			continue;
		}
		if (char === '"' || char === "'" || char === '`') {
			inString = true;
			stringDelimiter = char;
			continue;
		}
		if (char === '{') {
			depth += 1;
		} else if (char === '}') {
			depth -= 1;
			if (depth === 0) {
				break;
			}
		}
	}
	const sandbox = { fallback: null };
	vm.createContext(sandbox);
	vm.runInContext(`fallback = ${result};`, sandbox, { timeout: 1000 });
	return sandbox.fallback;
}

function compareString(pathLabel, apiValue, fallbackValue, issues) {
	if (typeof apiValue !== 'string' || !apiValue.trim()) {
		issues.push(`Valor ausente em db.json para ${pathLabel}.`);
		return;
	}
	if (typeof fallbackValue !== 'string' || !fallbackValue.trim()) {
		issues.push(`Valor ausente no fallback para ${pathLabel}.`);
		return;
	}
	if (apiValue.trim() !== fallbackValue.trim()) {
		issues.push(
			`Divergência em ${pathLabel}: API="${apiValue}" x fallback="${fallbackValue}".`
		);
	}
}

function ensureArray(label, value, issues) {
	if (!Array.isArray(value) || !value.length) {
		issues.push(`A seção ${label} está vazia ou não é um array.`);
	}
}

function main() {
	const db = loadJSON(dbPath);
	const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
	const fallback = extractFallbackObject(mainJs, 'const CONTENT_FALLBACK =');
	const issues = [];

	// Hero precisa ser idêntico para evitar mensagens desencontradas.
	['eyebrow', 'title', 'subtitle'].forEach(field => {
		compareString(`hero.${field}`, db.hero?.[field], fallback.hero?.[field], issues);
	});

	// Horários expostos ao público devem coincidir.
	ensureArray('db.hours', db.hours, issues);
	ensureArray('fallback.hours', fallback.hours, issues);
	if (Array.isArray(db.hours) && Array.isArray(fallback.hours)) {
		const minLength = Math.min(db.hours.length, fallback.hours.length);
		for (let i = 0; i < minLength; i += 1) {
			compareString(
				`hours[${i}].value`,
				db.hours[i]?.value,
				fallback.hours[i]?.value,
				issues
			);
		}
	}

	// Confere se as principais seções possuem conteúdo real para evitar cair só no fallback.
	['stats', 'services', 'faqs', 'team', 'testimonials'].forEach(section => {
		ensureArray(`db.${section}`, db[section], issues);
	});

	if (issues.length) {
		console.error('❌ Validação de conteúdo falhou:');
		issues.forEach(issue => console.error(` - ${issue}`));
		process.exit(1);
	}

	console.log('✅ Conteúdo validado: API e fallback estão alinhados.');
}

main();
