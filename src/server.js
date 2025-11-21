require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const apicache = require('apicache');
const xss = require('xss-clean');
const { env } = require('./config/env');
const { readContent } = require('./services/contentService');

const app = express();
const PORT = env.port;
const ROOT_DIR = path.join(__dirname, '..');
const STATIC_DIR = path.join(ROOT_DIR, 'docs');
const BLOCKED_PATTERNS = [
	/^\/\.env/i,
	/^\/src(?:\/|$)/i,
	/^\/db\.json$/i,
	/^\/package(?:-lock)?\.json$/i,
	/^\/logs(?:\/|$)/i,
	/^\/data(?:\/|$)/i,
	/^\/config(?:\/|$)/i,
	/^\/node_modules(?:\/|$)/i
];

const cspDirectives = {
	defaultSrc: ["'self'"],
	scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
	scriptSrcAttr: ["'none'"],
	styleSrc: [
		"'self'",
		'https://cdn.jsdelivr.net',
		'https://cdnjs.cloudflare.com',
		'https://fonts.googleapis.com'
	],
	styleSrcAttr: ["'none'"],
	fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com', 'data:'],
	imgSrc: ["'self'", 'data:', 'https://images.pexels.com', 'https://i.pravatar.cc'],
	connectSrc: ["'self'"],
	objectSrc: ["'none'"],
	frameAncestors: ["'none'"],
	baseUri: ["'self'"],
	formAction: ["'self'"],
	upgradeInsecureRequests: [],
	blockAllMixedContent: []
};

const cache = apicache.middleware;

app.disable('x-powered-by');
app.use(
	helmet({
		contentSecurityPolicy: { directives: cspDirectives },
		referrerPolicy: { policy: 'no-referrer-when-downgrade' },
		crossOriginEmbedderPolicy: true,
		crossOriginOpenerPolicy: { policy: 'same-origin' },
		crossOriginResourcePolicy: { policy: 'same-origin' },
		frameguard: { action: 'deny' },
		hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
		hidePoweredBy: true
	})
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Rate limiter removido para desenvolvimento
// const limiter = rateLimit({
// 	windowMs: 15 * 60 * 1000,
// 	max: 100,
// 	standardHeaders: true,
// 	legacyHeaders: false
// });
// app.use(limiter);
app.use(compression());
app.use(xss());

app.use((req, res, next) => {
	if (req.path.includes('..')) {
		return res.status(400).json({ message: 'Caminho inválido.' });
	}
	if (BLOCKED_PATTERNS.some(pattern => pattern.test(req.path))) {
		return res.status(404).send('Not found');
	}
	next();
});

const NO_STORE_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.map']);
const staticOptions = {
	index: false,
	fallthrough: true,
	setHeaders(res, filePath) {
		const ext = path.extname(filePath).toLowerCase();
		if (NO_STORE_EXTENSIONS.has(ext)) {
			res.setHeader('Cache-Control', 'no-store');
		} else {
			res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
		}
	}
};
if (fs.existsSync(STATIC_DIR)) {
	app.use(express.static(STATIC_DIR, staticOptions));
} else {
	console.warn('Diretório estático "docs/" não encontrado.');
}

app.get('/api/content', cache('5 minutes'), async (req, res) => {
	try {
		const data = await readContent();
		res.json(data);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ message: 'Não foi possível carregar os dados.' });
	}
});

app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api/')) {
		return next();
	}
	res.setHeader('Cache-Control', 'no-store');
	res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.use((err, req, res, _next) => {
	console.error(err);
	res.status(500).json({ message: 'Erro inesperado. Tente novamente em instantes.' });
});

app.listen(PORT, () => {
	console.log(`PontoVet rodando em http://localhost:${PORT}`);
});
