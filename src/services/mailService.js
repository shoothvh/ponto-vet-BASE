const nodemailer = require('nodemailer');
const fsp = require('fs/promises');
const path = require('path');

let transporter;

function initializeTransport() {
	if (transporter) {
		return transporter;
	}

	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
	if (!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS)) {
		return null;
	}

	transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT),
		secure: SMTP_SECURE === 'true',
		auth: {
			user: SMTP_USER,
			pass: SMTP_PASS
		}
	});

	return transporter;
}

async function logEmailFallback(payload, meta = {}) {
	const fallbackDir = path.join(process.cwd(), 'logs');
	await fsp.mkdir(fallbackDir, { recursive: true });
	const fallbackFile = path.join(fallbackDir, 'email-fallback.log');
	const entry = [
		`--- EMAIL NÃO ENVIADO (${new Date().toISOString()}) ---`,
		`Motivo: ${meta.reason || 'SMTP não configurado'}`,
		`Nome: ${payload.name}`,
		`Email: ${payload.email}`,
		payload.phone ? `Telefone: ${payload.phone}` : null,
		`Assunto: ${payload.subject}`,
		`Mensagem: ${payload.message}`,
		`--- fim ---\n`
	]
		.filter(Boolean)
		.join('\n');
	await fsp.appendFile(fallbackFile, entry, 'utf-8');
}

async function sendContactEmail(payload) {
	const mailer = initializeTransport();
	const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
	const toAddress = process.env.CONTACT_INBOX || process.env.MAIL_FROM || process.env.SMTP_USER;

	if (!(mailer && fromAddress && toAddress)) {
		await logEmailFallback(payload, { reason: 'Credenciais SMTP ausentes' });
		return { delivered: false, fallback: true };
	}

	const message = {
		from: fromAddress,
		to: toAddress,
		subject: `PontoVet | Novo contato: ${payload.subject}`,
		text: [
			`Nome: ${payload.name}`,
			`Email: ${payload.email}`,
			payload.phone ? `Telefone: ${payload.phone}` : null,
			`Mensagem:`,
			payload.message
		]
			.filter(Boolean)
			.join('\n'),
		html: `
            <h2>Novo contato no site</h2>
            <p><strong>Nome:</strong> ${payload.name}</p>
            <p><strong>Email:</strong> ${payload.email}</p>
            ${payload.phone ? `<p><strong>Telefone:</strong> ${payload.phone}</p>` : ''}
            <p><strong>Assunto:</strong> ${payload.subject}</p>
            <p><strong>Mensagem:</strong><br>${payload.message.replace(/\n/g, '<br>')}</p>
        `
	};

	try {
		const info = await mailer.sendMail(message);
		return { delivered: true, messageId: info.messageId };
	} catch (error) {
		await logEmailFallback(payload, { reason: error.message });
		return { delivered: false, fallback: true };
	}
}

module.exports = { sendContactEmail };
