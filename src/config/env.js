const DEFAULT_PORT = 3000;
const DEFAULT_LOG_LEVEL = 'info';

function normalizePort(value) {
	const parsed = Number(value ?? DEFAULT_PORT);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return DEFAULT_PORT;
	}
	return parsed;
}

const env = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: normalizePort(process.env.PORT),
	logLevel: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
	isProduction: (process.env.NODE_ENV || 'development') === 'production'
};

module.exports = { env };
