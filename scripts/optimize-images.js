#!/usr/bin/env node
/**
 * Advanced optimization for docs/img:
 * 1. Generate responsive variants (80,120,240px width) + original (capped at 1200px)
 * 2. Produce WebP (quality 75) and AVIF (quality 50) for each size
 * 3. Skip regeneration if target file is newer than source
 * 4. Preserve aspect ratio, avoid upscaling for small images
 * 5. Output naming pattern:
 *    <basename>-<size>.webp / .avif for responsive sizes
 *    <basename>.webp / .avif for the capped original
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'docs', 'img');
const MAX_WIDTH = 1200;
const SIZES = [80, 120, 240];
const WEBP_QUALITY = 75;
const AVIF_QUALITY = 50;

function isRaster(file) {
	return /\.(png|jpe?g)$/i.test(file);
}

function targetOutdated(src, dest) {
	if (!fs.existsSync(dest)) return true;
	const s = fs.statSync(src);
	const d = fs.statSync(dest);
	return d.mtimeMs < s.mtimeMs; // regenerate if destination older
}

async function processImage(file) {
	const full = path.join(IMAGES_DIR, file);
	const baseName = file.replace(/\.(png|jpe?g)$/i, '');
	const ext = path.extname(file).toLowerCase();
	const srcStat = fs.statSync(full);
	const img = sharp(full);
	const meta = await img.metadata();
	const intrinsicWidth = meta.width || MAX_WIDTH;

	// Generate responsive sizes
	for (const size of SIZES) {
		if (intrinsicWidth < size) {
			// Skip size larger than source
			continue;
		}
		await generateFormats(img, full, baseName, size, srcStat.size);
	}

	// Original capped size
	const finalWidth = intrinsicWidth > MAX_WIDTH ? MAX_WIDTH : intrinsicWidth;
	await generateFormats(img, full, baseName, finalWidth === intrinsicWidth ? null : finalWidth, srcStat.size);
}

async function generateFormats(originalSharp, srcPath, baseName, targetWidth, originalSize) {
	// Clone pipeline per output to avoid re-use issues
	let pipeline = originalSharp.clone();
	if (targetWidth && targetWidth > 0) {
		pipeline = pipeline.resize({ width: targetWidth });
	}
	const sizeSuffix = targetWidth ? `-${targetWidth}` : '';
	const webpOut = path.join(IMAGES_DIR, `${baseName}${sizeSuffix}.webp`);
	const avifOut = path.join(IMAGES_DIR, `${baseName}${sizeSuffix}.avif`);

	if (targetOutdated(srcPath, webpOut)) {
		await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(webpOut);
		report(baseName + sizeSuffix + '.webp', srcPath, webpOut, originalSize);
	} else {
		console.log('Skip (fresh):', path.basename(webpOut));
	}
	if (targetOutdated(srcPath, avifOut)) {
		await pipeline.clone().avif({ quality: AVIF_QUALITY }).toFile(avifOut);
		report(baseName + sizeSuffix + '.avif', srcPath, avifOut, originalSize);
	} else {
		console.log('Skip (fresh):', path.basename(avifOut));
	}
}

function report(outName, srcPath, outPath, originalSize) {
	const outSize = fs.statSync(outPath).size;
	console.log(
		`Generated ${outName} ${(originalSize/1024).toFixed(1)}KB -> ${(outSize/1024).toFixed(1)}KB (${((outSize/originalSize)*100).toFixed(1)}%)`
	);
}

async function run() {
	if (!fs.existsSync(IMAGES_DIR)) {
		console.error('Images directory not found:', IMAGES_DIR);
		process.exit(1);
	}
	const files = fs.readdirSync(IMAGES_DIR).filter(isRaster);
	if (!files.length) {
		console.log('No PNG/JPG images to optimize.');
		return;
	}
	for (const f of files) {
		try {
			await processImage(f);
		} catch (e) {
			console.error('Failed optimizing', f, e.message);
		}
	}
	console.log('Done.');
}

run();
