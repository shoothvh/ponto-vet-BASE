#!/usr/bin/env node
/**
 * Fetch external testimonial images and store locally in docs/img.
 * Creates names testimonial-1.(jpg) etc, then optimization script will produce variants.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const IMAGES_DIR = path.join(__dirname, '..', 'docs', 'img');
const DB_PATH = path.join(__dirname, '..', 'db.json');

function ensureDir() {
	if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function isExternal(url) {
	return /^https?:\/\//i.test(url);
}

function pickExtension(url) {
	const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
	const ext = (match ? match[1] : 'jpg').toLowerCase();
	return ext === 'jpeg' ? 'jpg' : ext;
}

function download(url, dest) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https
			.get(url, res => {
				if (res.statusCode !== 200) {
					file.close();
					fs.unlink(dest, () => {});
					return reject(new Error('HTTP ' + res.statusCode));
				}
				res.pipe(file);
				file.on('finish', () => file.close(resolve));
			})
			.on('error', err => {
				file.close();
				fs.unlink(dest, () => {});
				reject(err);
			});
	});
}

async function run() {
	ensureDir();
	if (!fs.existsSync(DB_PATH)) {
		console.error('db.json not found');
		process.exit(1);
	}
	const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
	if (!Array.isArray(data.testimonials)) {
		console.log('No testimonials array.');
		return;
	}
	let index = 1;
	for (const t of data.testimonials) {
		if (!t.image || !isExternal(t.image)) {
			continue;
		}
		const ext = pickExtension(t.image);
		const localBase = `testimonial-${index}`;
		const localName = `${localBase}.${ext}`;
		const outPath = path.join(IMAGES_DIR, localName);
		try {
			if (fs.existsSync(outPath)) {
				console.log('Skip existing', localName);
			} else {
				console.log('Downloading', t.image, '->', localName);
				await download(t.image, outPath);
			}
			// update in-memory path to local file (will write later)
			t.image = `img/${localName}`;
		} catch (e) {
			console.error('Failed', t.image, e.message);
		}
		index += 1;
	}
	fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
	console.log('Updated db.json testimonial image paths to local copies.');
}

run();
