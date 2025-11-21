#!/usr/bin/env node
/**
 * Scan docs/img for filenames with spaces and auto-fix (replace spaces with hyphens).
 * Warn about duplicates and produce a summary.
 */
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', 'docs', 'img');

function run() {
	if (!fs.existsSync(IMG_DIR)) {
		console.error('Image directory not found:', IMG_DIR);
		process.exit(1);
	}
	const files = fs.readdirSync(IMG_DIR);
	let fixed = 0;
	for (const file of files) {
		if (!file.includes(' ')) continue;
		const newName = file.replace(/\s+/g, '-');
		const src = path.join(IMG_DIR, file);
		const dest = path.join(IMG_DIR, newName);
		if (fs.existsSync(dest)) {
			console.warn('Skip rename (target exists):', file, '->', newName);
			continue;
		}
		fs.renameSync(src, dest);
		console.log('Renamed', file, '->', newName);
		fixed++;
	}
	if (!fixed) {
		console.log('No filenames with spaces found.');
	} else {
		console.log('Fixed', fixed, 'filenames.');
	}
}

run();
