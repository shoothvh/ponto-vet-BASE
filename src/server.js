require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const apicache = require('apicache');
const xss = require('xss-clean');
const { body, validationResult } = require('express-validator');
const { env } = require('./config/env');
const { readContent, logContact, persistContactRecord } = require('./services/contentService');
const { sendContactEmail } = require('./services/mailService');

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
const csrfProtection = csrf({ cookie: true });
const contactValidators = [
	body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
	body('email').isEmail().withMessage('E-mail inválido.'),
	body('subject').trim().notEmpty().withMessage('Assunto é obrigatório.'),
	body('message')
		.trim()
		.isLength({ min: 10 })
		.withMessage('Mensagem deve conter ao menos 10 caracteres.'),
	body('phone')
		.optional({ checkFalsy: true })
		.matches(/^[0-9+().\s-]{8,}$/)
		.withMessage('Telefone informado possui formatação inválida.')
];

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
app.use(cookieParser());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

app.use(limiter);
app.use(compression());
app.use(xss());
app.use(csrfProtection);

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

app.post('/api/contact', contactValidators, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}

	const sanitize = (value = '') => value.toString().trim().replace(/[<>]/g, '');
	const payload = {
		name: sanitize(req.body.name),
		email: sanitize(req.body.email),
		subject: sanitize(req.body.subject),
		message: sanitize(req.body.message),
		phone: sanitize(req.body.phone)
	};

	const record = {
		...payload,
		submittedAt: new Date().toISOString(),
		ip: req.ip,
		userAgent: req.get('user-agent') || 'unknown'
	};
	try {
		await Promise.all([logContact(payload), persistContactRecord(record)]);
	} catch (error) {
		console.error('Falha ao armazenar contato localmente:', error.message);
	}
	try {
		const delivery = await sendContactEmail(record);
		const message = delivery.delivered
			? 'Recebemos sua mensagem! Nossa dupla cirúrgica já foi avisada.'
			: 'Recebemos sua mensagem! Em breve retornamos (canal interno ainda não configurado).';
		res.status(201).json({ message });
	} catch (error) {
		console.error('Falha ao tentar enviar e-mail:', error.message);
		res.status(201).json({
			message: 'Recebemos sua mensagem! Retornaremos pelos canais informados.'
		});
	}
});

app.get('/api/csrf-token', (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api/')) {
		return next();
	}
	res.setHeader('Cache-Control', 'no-store');
	res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
	if (err.code === 'EBADCSRFTOKEN') {
		return res.status(403).json({ message: 'Falha na validação do token CSRF.' });
	}
	next(err);
});

app.use((err, req, res, _next) => {
	console.error(err);
	res.status(500).json({ message: 'Erro inesperado. Tente novamente em instantes.' });
});

app.listen(PORT, () => {
	console.log(`PontoVet rodando em http://localhost:${PORT}`);
});
