require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
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

app.get('/api/content', async (req, res) => {
	try {
		const data = await readContent();
		res.json(data);
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ message: 'Não foi possível carregar os dados.' });
	}
});

app.post('/api/contact', async (req, res) => {
	const sanitize = (value = '') => value.toString().trim().replace(/[<>]/g, '');
	const payload = {
		name: sanitize(req.body.name),
		email: sanitize(req.body.email),
		subject: sanitize(req.body.subject),
		message: sanitize(req.body.message),
		phone: sanitize(req.body.phone)
	};

	const requiredFields = ['name', 'email', 'subject', 'message'];
	const hasAllFields = requiredFields.every(field => payload[field]);
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const phonePattern = /^[0-9+().\s-]{8,}$/;

	if (!hasAllFields || !emailPattern.test(payload.email)) {
		return res
			.status(422)
			.json({ message: 'Confira os dados enviados antes de tentar novamente.' });
	}

	if (payload.phone && !phonePattern.test(payload.phone)) {
		return res.status(422).json({ message: 'Telefone informado possui formatação inválida.' });
	}

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
