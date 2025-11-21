const sanitizeHtml = require('sanitize-html');

// Conservative options: strip all HTML tags & attributes, keep plain text
const SANITIZE_OPTIONS = {
	allowedTags: [],
	allowedAttributes: {},
	allowedSchemes: ['http', 'https', 'mailto', 'tel']
};

function sanitizeValue(value) {
	if (typeof value === 'string') {
		return sanitizeHtml(value, SANITIZE_OPTIONS).trim();
	}
	if (Array.isArray(value)) {
		return value.map(v => sanitizeValue(v));
	}
	if (value && typeof value === 'object') {
		for (const key of Object.keys(value)) {
			value[key] = sanitizeValue(value[key]);
		}
	}
	return value;
}

function sanitizeRequest(req, _res, next) {
	if (req.body) req.body = sanitizeValue(req.body);
	if (req.query) req.query = sanitizeValue(req.query);
	if (req.params) req.params = sanitizeValue(req.params);
	next();
}

module.exports = { sanitizeRequest };
