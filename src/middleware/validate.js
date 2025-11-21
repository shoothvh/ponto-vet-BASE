const { z } = require('zod');

// Map de schemas por METHOD + PATH
// Exemplo de uso: POST /api/contact (formulário de contato futuro)
const routeSchemas = {
	'POST /api/contact': z.object({
		name: z.string().min(2).max(60),
		message: z.string().min(5).max(1000)
	})
};

function validationMiddleware(req, res, next) {
	const key = req.method + ' ' + req.path;
	const schema = routeSchemas[key];
	if (!schema) return next();

	// Validação ANTES da sanitização
	const result = schema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json({
			message: 'Dados inválidos',
			errors: result.error.issues.map(i => ({
				path: i.path.join('.'),
				message: i.message
			}))
		});
	}
	// Guarda versão validada; sanitização posterior pode limpar tags se existirem
	req.validated = result.data;
	return next();
}

module.exports = { validationMiddleware };
