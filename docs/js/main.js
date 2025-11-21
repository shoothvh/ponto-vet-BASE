(() => {
	const COMPONENT_SEQUENCE = [
		'header',
		'hero',
		'services',
		'about',
		'team',
		'testimonials',
		'contact',
		'footer'
	];
	const DEFAULT_INSTAGRAM_HANDLE = '@pontovetbilac';
	const DEFAULT_INSTAGRAM_URL = 'https://instagram.com/pontovetbilac';
	const FALLBACK_SECTION_LABELS = {
		stats: 'indicadores',
		services: 'serviços',
		faqs: 'perguntas frequentes',
		team: 'equipe',
		testimonials: 'depoimentos',
		hours: 'horários'
	};
	const CONTENT_FALLBACK = {
		hero: {
			eyebrow: 'Emergências, cirurgias e reprodução',
			title: 'PontoVet: O Centro Veterinário Completo de Bilac.',
			subtitle:
				'Consultas, exames, ultrassom e cirurgias em um só lugar. Atendimento especializado de segunda a sexta, das 08h30 às 18h00.',
			ctaPrimary: { label: 'Agende uma consulta', target: '#contato' },
			ctaSecondary: { label: 'Conheça os serviços', target: '#servicos' },
			highlights: []
		},
		stats: [
			{ label: 'Pets atendidos/ano', value: '+700' },
			{ label: 'Cirurgiões dedicados', value: '2' },
			{ label: 'Satisfação dos tutores', value: '98%' },
			{ label: 'Anos de história', value: '2' }
		],
		services: [
			{
				title: 'Consultas e Cirurgias',
				description:
					'Avaliação, planejamento e procedimentos conduzidos pela dupla fixa em Bilac.',
				icon: 'fas fa-stethoscope',
				category: 'tratamento',
				duration: 'Sob agendamento',
				priceHint: 'Planos cirúrgicos transparentes'
			},
			{
				title: 'Atendimento Emergencial',
				description:
					'Triagem imediata, estabilização e comunicação direta com a dupla cirúrgica.',
				icon: 'fas fa-kit-medical',
				category: 'tratamento',
				duration: 'Imediato',
				priceHint: 'Plantão sob disponibilidade'
			},
			{
				title: 'Exames e Ultrassonografia',
				description: 'Raio-X digital, ultrassom gestacional e doppler com laudos locais.',
				icon: 'fas fa-x-ray',
				category: 'diagnostico',
				duration: '30 min',
				priceHint: 'Exames a partir de R$95'
			},
			{
				title: 'Reprodução Bovina e Canina',
				description:
					'Coleta, inseminação e acompanhamento gestacional para plantéis e canis.',
				icon: 'fas fa-dna',
				category: 'tratamento',
				duration: 'Sob agenda',
				priceHint: 'Protocolos sob consulta'
			}
		],
		faqs: [
			{
				question: 'Vocês atendem emergências?',
				answer: 'Nossa cirurgiã e nosso cirurgião atuam em escala sob demanda; confirme disponibilidade pelo WhatsApp.'
			},
			{
				question: 'Quais formas de pagamento aceitam?',
				answer: 'Cartões, PIX, convênios pet selecionados e parcelamento.'
			}
		],
		team: [
			{
				name: 'Dra. Ana Moraes',
				role: 'Clínica geral e fundadora',
				crm: 'CRMV-SP 12345',
				specialties: ['Clínica médica', 'Intensivismo'],
				photo: 'https://images.pexels.com/photos/3714743/pexels-photo-3714743.jpeg?auto=compress&cs=tinysrgb&w=600'
			},
			{
				name: 'Dr. Matheus Menani',
				role: 'Cirurgião de tecidos moles e plantonista',
				specialties: ['Cirurgia geral', 'Atendimento emergencial'],
				photo: 'img/matheus foto.png'
			}
		],
		testimonials: [
			{
				author: 'Carlos Silva',
				quote: 'Atendimento humano e resultados rápidos. Recomendo!',
				image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600'
			},
			{
				author: 'Mariana Costa',
				quote: 'Minha gata sempre é tratada com muito carinho.',
				image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600'
			}
		],
		contact: {
			address: 'Rua XV de Novembro, 615 - Bilac/SP',
			phone: '(18) 99735-9924',
			whatsapp: '(18) 99735-9924',
			instagram: '@pontovetbilac',
			map: 'https://www.google.com/local/place/fid/0x94966f000e8f1c8b:0xd1defe03eee0ff5/photosphere?iu=https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=IlSrpQLB6SXLvE7r-OIxnw&cb_client=search.gws-prod.gps&yaw=303.80588&pitch=0&thumbfov=100&w=0&h=0&ik=CAISFklsU3JwUUxCNlNYTHZFN3ItT0l4bnc=&sa=X&ved=2ahUKEwjtuYiL0YGRAxW4D7kGHeEFJNYQpx96BAgyEAU',
			emergency: {
				phone: '(18) 99735-9924',
				instructions:
					'Envie WhatsApp informando cidade, espécie e exames recentes pra acionarmos a dupla.'
			}
		},
		hours: [
			{ label: 'Funcionamento', value: 'Segunda a sexta, 08h30 às 18h00' },
			{
				label: 'Emergências',
				value: 'Acione pelo WhatsApp (18) 99735-9924 para triagem imediata'
			}
		]
	};
	const appState = {
		services: [],
		contact: null
	};
	let motionObserver;
	let servicesEmptyState;
	let lastFilterEmpty = false;

	document.addEventListener('DOMContentLoaded', initializeApplication);

	async function initializeApplication() {
		await injectComponents();
		const content = await fetchContent();
		hydrateContent(content);
		setupInteractions(content);
		updateCurrentYear();
		console.info('PontoVet UI inicializada.');
	}

	async function injectComponents() {
		const root = document.getElementById('app');
		if (!root) {
			console.error("Elemento '#app' não encontrado.");
			return;
		}

		root.setAttribute('aria-busy', 'true');
		for (const name of COMPONENT_SEQUENCE) {
			try {
				const response = await fetch(`components/${name}.html`, { cache: 'no-store' });
				if (!response.ok) {
					throw new Error(`${response.status} ${response.statusText}`);
				}
				const html = await response.text();
				const template = document.createElement('template');
				template.innerHTML = html.trim();
				root.appendChild(template.content.cloneNode(true));
			} catch (error) {
				console.error(`Erro ao carregar componente ${name}`, error);
				const fallback = document.createElement('section');
				fallback.className = 'container py-5 text-center text-muted';
				fallback.innerHTML = `<p>Não foi possível carregar a seção "${name}".</p>`;
				root.appendChild(fallback);
			}
		}
		root.setAttribute('aria-busy', 'false');
	}

	async function fetchContent() {
		try {
			const response = await fetch('/api/content', { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`${response.status} ${response.statusText}`);
			}
			return await response.json();
		} catch (error) {
			console.error('Falha ao buscar conteúdo dinâmico.', error);
			showToast(
				'Não conseguimos atualizar o conteúdo agora. Exibindo dados padrão.',
				'warning'
			);
			return {};
		}
	}

	function hydrateContent(data = {}) {
		const fallbackSections = [];
		const pickArray = key => {
			if (Array.isArray(data[key]) && data[key].length) {
				return data[key];
			}
			const label = FALLBACK_SECTION_LABELS[key] || key;
			fallbackSections.push(label);
			return CONTENT_FALLBACK[key];
		};
		const hero = data.hero || CONTENT_FALLBACK.hero;
		const stats = pickArray('stats');
		const services = pickArray('services');
		const faqs = pickArray('faqs');
		const team = pickArray('team');
		const testimonials = pickArray('testimonials');
		const contact = data.contact || CONTENT_FALLBACK.contact;
		const social = Array.isArray(data.social) ? data.social : [];
		const hours = pickArray('hours');

		appState.contact = contact;
		renderHero(hero);
		renderStats(stats);
		renderServices(services);
		renderFaqs(faqs);
		updateFaqStructuredData(faqs);
		renderTeam(team);
		renderTestimonials(testimonials);
		renderContactInfo(contact, social);
		renderHours(hours);
		if (fallbackSections.length) {
			const readable = formatList(fallbackSections);
			showToast(`Exibindo dados padrão para ${readable}.`, 'info');
		}
	}

	function setupInteractions(content = {}) {
		secureExternalLinks();
		setupServiceFilters();
		setupFaqAccordions();
		setupContactForm();
		setupButtonPointerGlow();
		setupMotionEffects();
		setupThemeSwitcher();
		setupSmoothScroll();
		highlightNavOnScroll();
		updateCurrentYear();
		if (!content.services || !content.services.length) {
			showToast('Atualize o conteúdo em breve para preencher serviços.', 'warning');
		}
	}

	function renderHero(hero = {}) {
		const heroSection = document.getElementById('hero');
		if (!heroSection) {
			return;
		}

		setText(heroSection.querySelector('.hero-eyebrow'), hero.eyebrow);
		setText(heroSection.querySelector('h1'), hero.title);
		setText(heroSection.querySelector('.hero-description'), hero.subtitle);

		const primaryCTA = heroSection.querySelector('[data-hero-primary]');
		if (primaryCTA && hero.ctaPrimary) {
			setText(primaryCTA, hero.ctaPrimary.label);
			setHref(primaryCTA, hero.ctaPrimary.target);
		}

		const secondaryCTA = heroSection.querySelector('[data-hero-secondary]');
		if (secondaryCTA && hero.ctaSecondary) {
			setText(secondaryCTA, hero.ctaSecondary.label);
			setHref(secondaryCTA, hero.ctaSecondary.target);
		}

		const highlightsList = heroSection.querySelector('.hero-highlights');
		if (highlightsList) {
			highlightsList.innerHTML = '';
			(hero.highlights || []).forEach(entry => {
				const item = document.createElement('li');
				item.textContent = entry;
				highlightsList.appendChild(item);
			});
		}
	}

	function renderStats(stats = []) {
		const container = document.querySelector('[data-stats-list]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		if (!stats.length) {
			container.innerHTML =
				'<div class="col-12 text-center">Novos indicadores em breve.</div>';
			return;
		}
		stats.forEach(stat => {
			const column = document.createElement('div');
			column.className = 'col-sm-3 col-6';
			column.innerHTML = `
				<div class="stat-card">
					<span class="stat-value">${escapeHTML(stat.value)}</span>
					<span class="stat-label">${escapeHTML(stat.label)}</span>
				</div>`;
			container.appendChild(column);
		});
	}

	function renderServices(services = []) {
		const container = document.querySelector('[data-services-list]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		appState.services = services.map(service => ({
			...service,
			category: (service.category || 'outros').toLowerCase()
		}));
		lastFilterEmpty = false;

		if (!appState.services.length) {
			container.innerHTML =
				'<div class="col-12 text-center">Cadastre serviços no painel administrativo.</div>';
			return;
		}

		appState.services.forEach(service => {
			const card = document.createElement('div');
			card.className = 'col-lg-4 col-md-6 mb-4';
			card.dataset.category = service.category;
			card.innerHTML = `
				<article class="card h-100">
					<div class="card-body">
						<div class="service-icon"><i class="${escapeHTML(service.icon || 'fas fa-paw')}"></i></div>
						<h3 class="card-title">${escapeHTML(service.title)}</h3>
						<p class="card-text">${escapeHTML(service.description)}</p>
						${renderServiceMeta(service)}
					</div>
				</article>`;
			container.appendChild(card);
		});
		if (!servicesEmptyState) {
			servicesEmptyState = document.createElement('div');
			servicesEmptyState.className = 'col-12 services-empty-state d-none';
			servicesEmptyState.setAttribute('data-services-empty', '');
			servicesEmptyState.setAttribute('role', 'status');
			servicesEmptyState.setAttribute('aria-live', 'polite');
			servicesEmptyState.tabIndex = -1;
			servicesEmptyState.innerHTML = `
				<div class="empty-state-card">
					<h3>Nenhum serviço nessa categoria</h3>
					<p>Volte para outra aba ou fale com nossa equipe pelo WhatsApp para receber o portfólio completo.</p>
				</div>`;
		}
		if (!container.contains(servicesEmptyState)) {
			container.appendChild(servicesEmptyState);
		}
		servicesEmptyState.classList.add('d-none');
	}

	function renderServiceMeta(service) {
		const parts = [];
		if (service.duration) {
			parts.push(`<li><i class="far fa-clock"></i> ${escapeHTML(service.duration)}</li>`);
		}
		if (service.priceHint) {
			parts.push(`<li><i class="fas fa-tag"></i> ${escapeHTML(service.priceHint)}</li>`);
		}
		if (!parts.length) {
			return '';
		}
		return `<ul class="service-meta list-unstyled">${parts.join('')}</ul>`;
	}

	function renderFaqs(faqs = []) {
		const container = document.querySelector('[data-faq-list]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		if (!faqs.length) {
			container.innerHTML =
				'<div class="text-center">Atualize as perguntas frequentes em breve.</div>';
			return;
		}
		faqs.forEach((faq, index) => {
			const item = document.createElement('article');
			item.className = 'accordion-item';
			item.innerHTML = `
				<button class="accordion-button" type="button" aria-expanded="false" data-faq-toggle data-faq-index="${index}">
					${escapeHTML(faq.question)}<span class="accordion-indicator"><i class="fas fa-chevron-down"></i></span>
				</button>
				<div class="accordion-panel" role="region" hidden>
					<p>${escapeHTML(faq.answer)}</p>
				</div>`;
			container.appendChild(item);
		});
	}

	function renderTeam(team = []) {
		const container = document.querySelector('[data-team-list]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		if (!team.length) {
			container.innerHTML =
				'<div class="col-12 text-center">Nossa dupla está em atualização.</div>';
			return;
		}
		team.forEach(member => {
			const column = document.createElement('div');
			column.className = 'col-lg-3 col-md-4 col-sm-6';
			column.innerHTML = `
				<article class="team-card card h-100 text-center">
					${member.photo ? `<div class="team-photo"><img src="${escapeAttribute(member.photo)}" alt="${escapeAttribute(member.name || 'Profissional PontoVet')}" loading="lazy"></div>` : ''}
					<h3 class="team-name">${escapeHTML(member.name || 'Profissional PontoVet')}</h3>
					<p class="team-role">${escapeHTML(member.role || 'Especialista')}</p>
					${member.crm ? `<p class="team-crm">${escapeHTML(member.crm)}</p>` : ''}
					${renderSpecialties(member.specialties)}
				</article>`;
			container.appendChild(column);
		});
	}

	function renderSpecialties(list = []) {
		if (!Array.isArray(list) || !list.length) {
			return '';
		}
		const items = list
			.map(spec => `<li class="list-inline-item">${escapeHTML(spec)}</li>`)
			.join('');
		return `<ul class="team-specialties list-inline">${items}</ul>`;
	}

	function renderTestimonials(testimonials = []) {
		const container = document.querySelector('[data-testimonials-list]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		if (!testimonials.length) {
			container.innerHTML =
				'<div class="col-12 text-center">Seja o primeiro a enviar um depoimento.</div>';
			return;
		}
		testimonials.forEach(testimonial => {
			const column = document.createElement('div');
			column.className = 'col-md-4 mb-4';
			column.innerHTML = `
				<article class="testimonial-card">
					<div class="testimonial-avatar">
						<img src="${escapeAttribute(testimonial.image)}" alt="${escapeAttribute(testimonial.author)}">
					</div>
					<p class="testimonial-quote">"${escapeHTML(testimonial.quote)}"</p>
					<div class="testimonial-author">${escapeHTML(testimonial.author)}</div>
				</article>`;
			container.appendChild(column);
		});
	}

	function renderContactInfo(contact = {}, social = []) {
		const container = document.querySelector('[data-contact-info]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		const normalizedPhoneNumber = normalizeWhatsappNumber(contact.phone);
		const normalizedWhatsappNumber = normalizeWhatsappNumber(contact.whatsapp);
		const fallbackWhatsappNumber =
			normalizedWhatsappNumber || normalizedPhoneNumber || resolveWhatsappNumber();
		const instagramData = (() => {
			if (contact.instagram) {
				const handle = contact.instagram.trim();
				const profile = handle
					? `https://instagram.com/${handle.replace(/^@/, '')}`
					: 'https://instagram.com';
				return { handle: handle || '@instagram', url: profile };
			}
			if (Array.isArray(social)) {
				const igEntry = social.find(
					item => (item.platform || '').toLowerCase() === 'instagram'
				);
				if (igEntry?.url) {
					const slug = igEntry.url
						.replace(/https?:\/\/(www\.)?instagram\.com\//i, '')
						.replace(/\/$/, '');
					const handle = slug ? `@${slug}` : '@instagram';
					return { handle, url: igEntry.url };
				}
			}
			return { handle: DEFAULT_INSTAGRAM_HANDLE, url: DEFAULT_INSTAGRAM_URL };
		})();
		const entries = [
			contact.address && {
				icon: 'fas fa-map-marker-alt',
				label: 'Endereço',
				value: contact.address
			},
			contact.phone && {
				icon: 'fas fa-phone',
				label:
					contact.whatsapp && contact.whatsapp.trim() !== contact.phone.trim()
						? 'Telefone'
						: 'WhatsApp/Telefone',
				value: contact.phone,
				type: 'whatsapp-link',
				url: createWhatsappLink(normalizedPhoneNumber || fallbackWhatsappNumber)
			},
			contact.whatsapp &&
				(!contact.phone || contact.whatsapp.trim() !== contact.phone.trim()) && {
					icon: 'fab fa-whatsapp',
					label: 'WhatsApp',
					value: contact.whatsapp,
					type: 'whatsapp-link',
					url: createWhatsappLink(normalizedWhatsappNumber || fallbackWhatsappNumber)
				},
			instagramData && {
				icon: 'fab fa-instagram',
				label: 'Instagram',
				value: instagramData.handle,
				url: instagramData.url,
				type: 'instagram'
			},
			contact.map && {
				icon: 'fas fa-location-dot',
				label: 'Mapa',
				value: contact.map,
				type: 'link'
			},
			contact.emergency?.phone && {
				icon: 'fas fa-truck-medical',
				label: 'Emergência',
				value: `${contact.emergency.phone} ${contact.emergency.instructions || ''}`.trim()
			}
		].filter(Boolean);

		if (!entries.length) {
			container.innerHTML = '<p>Dados para contato ainda não configurados.</p>';
			return;
		}

		entries.forEach(entry => {
			const paragraph = document.createElement('p');
			if (entry.type === 'link') {
				const anchor = document.createElement('a');
				anchor.href = entry.value;
				anchor.target = '_blank';
				anchor.rel = 'noopener';
				anchor.textContent = 'Abrir mapa';
				paragraph.innerHTML = `<strong><i class="${entry.icon}"></i> ${entry.label}: </strong>`;
				paragraph.appendChild(anchor);
			} else if (entry.type === 'instagram') {
				const anchor = document.createElement('a');
				anchor.href = entry.url || 'https://instagram.com';
				anchor.target = '_blank';
				anchor.rel = 'noopener';
				anchor.textContent = entry.value || '@instagram';
				paragraph.innerHTML = `<strong><i class="${entry.icon}"></i> ${entry.label}: </strong>`;
				paragraph.appendChild(anchor);
			} else if (entry.type === 'whatsapp-link' && entry.url) {
				const anchor = document.createElement('a');
				anchor.href = entry.url;
				anchor.target = '_blank';
				anchor.rel = 'noopener';
				anchor.textContent = entry.value || entry.url;
				paragraph.innerHTML = `<strong><i class="${entry.icon}"></i> ${entry.label}: </strong>`;
				paragraph.appendChild(anchor);
			} else {
				paragraph.innerHTML = `<strong><i class="${entry.icon}"></i> ${entry.label}:</strong> ${escapeHTML(entry.value)}`;
			}
			container.appendChild(paragraph);
		});
	}

	function renderHours(hours = []) {
		const container = document.querySelector('[data-hours-list]');
		if (!container) {
			return;
		}
		container.innerHTML = '';
		if (!hours.length) {
			container.innerHTML = '<li>Consulte horários pelo WhatsApp.</li>';
			return;
		}
		hours.forEach(hour => {
			const item = document.createElement('li');
			item.innerHTML = `<strong>${escapeHTML(hour.label)}:</strong> ${escapeHTML(hour.value)}`;
			container.appendChild(item);
		});
	}

	function setupServiceFilters() {
		const tabs = document.querySelectorAll('.services-tab');
		const container = document.querySelector('[data-services-list]');
		if (!tabs.length || !container) {
			return;
		}

		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				const category = tab.getAttribute('data-services-filter');
				tabs.forEach(btn => btn.classList.toggle('active', btn === tab));
				filterServices(category);
			});
		});
	}

	function filterServices(category = 'all') {
		const cards = document.querySelectorAll('[data-services-list] [data-category]');
		let visibleCount = 0;
		cards.forEach(card => {
			const matches = category === 'all' || card.dataset.category === category;
			card.classList.toggle('d-none', !matches);
			if (matches) {
				visibleCount += 1;
			}
		});
		const noMatches = visibleCount === 0;
		if (servicesEmptyState) {
			servicesEmptyState.classList.toggle('d-none', !noMatches);
			if (noMatches) {
				servicesEmptyState.focus();
			}
		}
		if (noMatches && !lastFilterEmpty) {
			showToast(
				'Nenhum serviço disponível nessa categoria agora. Experimente outra aba ou fale conosco.',
				'info'
			);
		}
		lastFilterEmpty = noMatches;
	}

	function setupFaqAccordions() {
		const buttons = document.querySelectorAll('[data-faq-toggle]');
		buttons.forEach(button => {
			button.addEventListener('click', () => {
				const panel = button.nextElementSibling;
				const expanded = button.getAttribute('aria-expanded') === 'true';
				const item = button.closest('.accordion-item');
				button.setAttribute('aria-expanded', (!expanded).toString());
				panel.hidden = expanded;
				if (item) {
					item.classList.toggle('is-open', !expanded);
				}
			});
		});
	}

	function setupMotionEffects() {
		requestAnimationFrame(() => {
			const groups = [
				{ selector: '#hero .hero-copy > *', preset: 'fade-up', stagger: 80 },
				{ selector: '#hero .hero-figure', preset: 'fade-left', delay: 150 },
				{ selector: '.services-tab', preset: 'fade-up', stagger: 50 },
				{ selector: '[data-services-list] .card', preset: 'fade-up', stagger: 70 },
				{ selector: '.faq .accordion-item', preset: 'fade-up', stagger: 60 },
				{ selector: '[data-team-list] .team-card', preset: 'zoom-in', stagger: 80 },
				{
					selector: '[data-testimonials-list] .testimonial-card',
					preset: 'fade-up',
					stagger: 80
				},
				{ selector: '.contact-card, .contact-info-card', preset: 'fade-up', stagger: 70 },
				{ selector: 'footer .col-md-4', preset: 'fade-up', stagger: 70 }
			];
			applyMotionGroups(groups);
		});
	}

	function applyMotionGroups(groups = []) {
		const observer = getMotionObserver();
		groups.forEach(config => {
			const selectors = Array.isArray(config.selector) ? config.selector : [config.selector];
			let index = 0;
			selectors.forEach(selector => {
				const targets = document.querySelectorAll(selector);
				targets.forEach(target => {
					if (!target || target.dataset.motionReady === 'true') {
						return;
					}
					target.dataset.motionReady = 'true';
					target.classList.add('reveal-on-scroll');
					setMotionPreset(target, config.preset, config.delay, config.stagger, index);
					if (typeof observer.observe === 'function') {
						observer.observe(target);
					} else {
						target.classList.add('is-visible');
					}
					index += 1;
				});
			});
		});
	}

	function setMotionPreset(element, preset = 'fade-up', delay = 0, stagger = 0, index = 0) {
		const presets = {
			'fade-up': { '--reveal-y': '40px', '--reveal-blur': '14px' },
			'fade-left': { '--reveal-x': '40px', '--reveal-blur': '12px' },
			'fade-right': { '--reveal-x': '-40px', '--reveal-blur': '12px' },
			'zoom-in': { '--reveal-scale': '0.9', '--reveal-blur': '10px' }
		};
		const overrides = presets[preset] || presets['fade-up'];
		Object.entries(overrides).forEach(([prop, value]) => {
			element.style.setProperty(prop, value);
		});
		const totalDelay = (delay || 0) + (stagger || 0) * index;
		if (totalDelay > 0) {
			element.style.setProperty('--reveal-delay', `${totalDelay}ms`);
		}
	}

	function getMotionObserver() {
		if (motionObserver) {
			return motionObserver;
		}
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			motionObserver = {
				observe(element) {
					element.classList.add('is-visible');
				},
				unobserve() {}
			};
			return motionObserver;
		}
		motionObserver = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (!entry.isIntersecting) {
						return;
					}
					entry.target.classList.add('is-visible');
					if (typeof motionObserver.unobserve === 'function') {
						motionObserver.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.2, rootMargin: '0px 0px -60px' }
		);
		return motionObserver;
	}

	function setupButtonPointerGlow() {
		const buttons = document.querySelectorAll('.btn');
		if (!buttons.length) {
			return;
		}
		buttons.forEach(button => {
			button.addEventListener('pointermove', event => {
				const rect = button.getBoundingClientRect();
				const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
				const relativeY = ((event.clientY - rect.top) / rect.height) * 100;
				button.style.setProperty('--btn-pointer-x', `${relativeX}%`);
				button.style.setProperty('--btn-pointer-y', `${relativeY}%`);
				button.style.setProperty('--btn-pointer-opacity', '0.9');
			});
			button.addEventListener('pointerleave', () => {
				button.style.removeProperty('--btn-pointer-x');
				button.style.removeProperty('--btn-pointer-y');
				button.style.removeProperty('--btn-pointer-opacity');
			});
		});
	}

	function setupContactForm() {
		const form = document.getElementById('contactForm');
		if (!form) {
			return;
		}
		const feedback = form.querySelector('[data-form-feedback]');
		const submit = form.querySelector('button[type="submit"]');
		const honeypot = form.querySelector('[data-honeypot]');

		form.addEventListener('submit', async event => {
			event.preventDefault();
			if (honeypot && honeypot.value.trim()) {
				showToast('Detectamos atividade suspeita. Tente novamente.', 'warning');
				form.reset();
				return;
			}
			const payload = Object.fromEntries(new FormData(form));
			const whatsappNumber = resolveWhatsappNumber();
			if (!whatsappNumber) {
				showInlineFeedback(
					'Canal de WhatsApp indisponível no momento. Utilize o botão lateral.',
					'danger'
				);
				showToast('WhatsApp não configurado.', 'danger');
				return;
			}
			const message = buildWhatsappMessage(payload);
			const whatsappUrl = buildWhatsappUrl(whatsappNumber, message);
			try {
				disableButton(submit, true);
				const newWindow = window.open(whatsappUrl, '_blank');
				if (!newWindow) {
					throw new Error(
						'Não foi possível abrir o WhatsApp. Desative o bloqueador de pop-ups e tente novamente.'
					);
				}
				showInlineFeedback(
					'Abrimos o WhatsApp com todos os dados preenchidos. Finalize o envio por lá.',
					'success'
				);
				showToast('Conversa do WhatsApp iniciada com os dados do formulário.', 'success');
				form.reset();
			} catch (error) {
				console.error('Erro ao redirecionar para o WhatsApp', error);
				showInlineFeedback(error.message || 'Não foi possível abrir o WhatsApp.', 'danger');
				showToast('Não conseguimos abrir o WhatsApp. Tente novamente.', 'danger');
			} finally {
				disableButton(submit, false);
			}
		});

		function showInlineFeedback(message, variant) {
			if (!feedback) {
				return alert(message);
			}
			feedback.textContent = message;
			feedback.className = `alert alert-${variant}`;
			feedback.classList.remove('d-none');
			if (showInlineFeedback.hideTimer) {
				clearTimeout(showInlineFeedback.hideTimer);
			}
			showInlineFeedback.hideTimer = setTimeout(() => {
				feedback.classList.add('d-none');
			}, 6000);
		}
	}

	function disableButton(button, loading) {
		if (!button) {
			return;
		}
		button.disabled = loading;
		button.dataset.originalText = button.dataset.originalText || button.textContent;
		button.textContent = loading ? 'Enviando...' : button.dataset.originalText;
	}

	function normalizeWhatsappNumber(value) {
		if (!value) {
			return '';
		}
		const digits = value.toString().replace(/\D/g, '');
		if (!digits) {
			return '';
		}
		if (digits.startsWith('55') && digits.length >= 12) {
			return digits;
		}
		if (digits.length >= 10 && digits.length <= 11) {
			return `55${digits}`;
		}
		return digits;
	}

	function resolveWhatsappNumber(preferredNumber) {
		const candidates = [
			preferredNumber,
			appState.contact?.whatsapp,
			appState.contact?.phone,
			CONTENT_FALLBACK.contact.whatsapp,
			CONTENT_FALLBACK.contact.phone
		].filter(Boolean);
		for (const candidate of candidates) {
			const normalized = normalizeWhatsappNumber(candidate);
			if (normalized) {
				return normalized;
			}
		}
		return '';
	}

	function createWhatsappLink(number) {
		const normalized = normalizeWhatsappNumber(number);
		return normalized ? `https://wa.me/${normalized}` : '';
	}

	function buildWhatsappMessage(data = {}) {
		const safe = (value, fallback = '---') => {
			const text = (value || '').toString().trim();
			return text || fallback;
		};
		const sections = [`Nome: ${safe(data.name)}`, `Assunto: ${safe(data.subject)}`];
		const extra = (data.message || '').toString().trim();
		sections.push(`Detalhes: ${extra || 'Tutor preferiu explicar por voz'}`);
		return sections.join('\n');
	}

	function buildWhatsappUrl(number, message) {
		const normalized = normalizeWhatsappNumber(number);
		if (!normalized) {
			return '';
		}
		const encoded = encodeURIComponent(message || 'Olá, gostaria de falar com a PontoVet.');
		return `https://wa.me/${normalized}?text=${encoded}`;
	}

	function setupThemeSwitcher() {
		const toggle = document.getElementById('theme-toggle');
		if (!toggle) {
			return;
		}
		const stored = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = stored === 'dark-mode' || (!stored && prefersDark);
		applyTheme(isDark);
		toggle.checked = isDark;
		toggle.addEventListener('change', event => {
			applyTheme(event.target.checked, true);
		});
	}

	function applyTheme(isDark, animate) {
		document.body.classList.toggle('dark-mode', isDark);
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) {
			meta.setAttribute('content', isDark ? '#05070b' : '#f5f7fa');
		}
		if (animate) {
			document.body.classList.add('theme-transition');
			setTimeout(() => document.body.classList.remove('theme-transition'), 500);
		}
		if (isDark) {
			localStorage.setItem('theme', 'dark-mode');
		} else {
			localStorage.removeItem('theme');
		}
	}

	function setupSmoothScroll() {
		const navbar = document.querySelector('.navbar');
		const offset = navbar?.offsetHeight || 0;
		document.querySelectorAll('a.nav-link[href^="#"]').forEach(link => {
			link.addEventListener('click', event => {
				const target = document.querySelector(link.getAttribute('href'));
				if (!target) {
					return;
				}
				event.preventDefault();
				const top = target.getBoundingClientRect().top + window.scrollY - offset;
				window.scrollTo({ top, behavior: 'smooth' });
			});
		});
	}

	function highlightNavOnScroll() {
		const sections = document.querySelectorAll('section[id]');
		const navLinks = document.querySelectorAll('.nav-link');
		const observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (!entry.isIntersecting) {
						return;
					}
					navLinks.forEach(link => {
						link.classList.toggle(
							'active',
							link.getAttribute('href') === `#${entry.target.id}`
						);
					});
				});
			},
			{ threshold: 0.3 }
		);
		sections.forEach(section => observer.observe(section));
	}

	function secureExternalLinks() {
		document.querySelectorAll('a[href^="http"]').forEach(link => {
			if (link.host !== window.location.host) {
				link.rel = 'noopener noreferrer';
				link.target = '_blank';
			}
		});
	}

	function setText(element, value) {
		if (element && value) {
			element.textContent = value;
		}
	}

	function setHref(element, value) {
		if (element && value) {
			element.setAttribute('href', value);
		}
	}

	function escapeHTML(value = '') {
		const div = document.createElement('div');
		div.textContent = value;
		return div.innerHTML;
	}

	function escapeAttribute(value = '') {
		const div = document.createElement('div');
		div.textContent = value;
		return div.innerHTML.replace(/"/g, '&quot;');
	}

	function showToast(message, variant = 'info') {
		if (!message) {
			return;
		}
		const stack = getToastStack();
		const toast = document.createElement('div');
		toast.className = `toast-notice toast-${variant}`;
		toast.textContent = message;
		stack.appendChild(toast);
		requestAnimationFrame(() => toast.classList.add('is-visible'));
		setTimeout(() => {
			toast.classList.remove('is-visible');
			toast.addEventListener('transitionend', () => toast.remove(), { once: true });
		}, 4000);
	}

	function getToastStack() {
		let stack = document.querySelector('[data-toast-stack]');
		if (!stack) {
			stack = document.createElement('div');
			stack.className = 'toast-stack';
			stack.setAttribute('data-toast-stack', '');
			document.body.appendChild(stack);
		}
		return stack;
	}

	function updateCurrentYear() {
		const target = document.getElementById('currentYear');
		if (target) {
			target.textContent = new Date().getFullYear();
		}
	}

	function updateFaqStructuredData(faqs = []) {
		const target = document.getElementById('faq-structured-data');
		if (!target) {
			return;
		}
		const entries = (Array.isArray(faqs) ? faqs : []).filter(
			item => item && item.question && item.answer
		);
		if (!entries.length) {
			target.textContent = '';
			return;
		}
		const payload = {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: entries.map(faq => ({
				'@type': 'Question',
				name: faq.question,
				acceptedAnswer: {
					'@type': 'Answer',
					text: faq.answer
				}
			}))
		};
		target.textContent = JSON.stringify(payload);
	}

	function formatList(items = []) {
		if (!Array.isArray(items) || !items.length) {
			return '';
		}
		if (typeof Intl !== 'undefined' && typeof Intl.ListFormat === 'function') {
			return new Intl.ListFormat('pt-BR', {
				style: 'long',
				type: 'conjunction'
			}).format(items);
		}
		if (items.length === 1) {
			return items[0];
		}
		return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
	}
})();
