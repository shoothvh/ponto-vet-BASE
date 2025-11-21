require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const apicache = require('apicache');
// XSS sanitization handled via custom middleware using sanitize-html
const { sanitizeRequest } = require('./middleware/sanitize');
const { validationMiddleware } = require('./middleware/validate');
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
if (env.isProduction) {
	app.use(
		helmet({
			contentSecurityPolicy: { directives: cspDirectives },
			referrerPolicy: { policy: 'no-referrer' },
			frameguard: { action: 'deny' },
			hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
			hidePoweredBy: true
		})
	);
} else {
	// Em desenvolvimento desabilita CSP estrito para facilitar debug de scripts/estilos
	app.use(
		helmet({
			contentSecurityPolicy: false,
			crossOriginResourcePolicy: false,
			crossOriginOpenerPolicy: false,
			crossOriginEmbedderPolicy: false,
			hidePoweredBy: true
		})
	);
}
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
// Validação de schema ANTES da sanitização (pedido do usuário)
app.use(validationMiddleware);
app.use(sanitizeRequest);

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
const LONG_CACHE_IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const staticOptions = {
	index: false,
	fallthrough: true,
	setHeaders(res, filePath) {
		const ext = path.extname(filePath).toLowerCase();
		if (NO_STORE_EXTENSIONS.has(ext)) {
			res.setHeader('Cache-Control', 'no-store');
		} else if (LONG_CACHE_IMAGES.has(ext)) {
			// 30 dias de cache para imagens otimizadas (imutáveis)
			res.setHeader('Cache-Control', 'public, max-age=' + 60 * 60 * 24 * 30 + ', immutable');
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

// Endpoint exemplo de contato sem campo de email (apenas nome e mensagem)
// Teste rápido:
// curl -X POST http://localhost:" + PORT + "/api/contact -H "Content-Type: application/json" -d '{"name":"Teste","message":"Olá mensagem"}'
app.post('/api/contact', (req, res) => {
	// Após validação e sanitização, dados ficam em req.validated
	if (!req.validated) {
		return res.status(500).json({ message: 'Falha de validação inesperada.' });
	}
	// Aqui poderíamos enviar email ou persistir; por ora apenas retorna eco seguro
	res.status(202).json({ message: 'Recebido com sucesso', data: req.validated });
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
