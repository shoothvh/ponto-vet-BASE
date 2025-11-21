# PontoVet – Plano de Qualidade

Este plano resume os eixos adotados para melhorar a "qualidade de vida" do código em todo o projeto.

## 1. Fundamentos de engenharia

- Adicionar ESLint (Flat Config) e Prettier para padronizar estilo, detectar problemas comuns e automatizar checks via `npm run lint` / `npm run format`.
- Introduzir `.editorconfig` para alinhar IDEs em indentação, charset e finais de linha.
- Documentar instruções de contribuição (`README` atualizada com scripts, variáveis e fluxo de QA).

## 2. Backend mais saudável

- Extrair acesso a arquivos (`db.json`, logs, contatos) para um serviço dedicado que usa `fs/promises`, cache leve e validação de schema.
- Criar módulo `config/env.js` que valida variáveis obrigatórias e expõe defaults em um único lugar.
- Melhorar respostas de erro (mensagens consistentes, IDs de correlação) e logging estruturado.

## 3. Frontend sustentável

- Centralizar helpers reutilizados (ex.: normalização de WhatsApp, animações) em módulos reutilizáveis.
- Adicionar pequenos data-attributes para mapear CTA → WhatsApp automaticamente, evitando duplicação.
- Revisar CSS para usar variáveis compartilhadas e remover estilos não utilizados.

## 4. Observabilidade e testes

- Adicionar testes unitários simples para helpers críticos (normalização de contato, construção de mensagens).
- Configurar `npm run check` agregando lint + testes para pipelines.

## 5. Automação futura

- Preparar GitHub Actions (ou outro CI) para executar lint/test a cada PR.
- Opcional: adicionar Husky + lint-staged para garantir formatação antes de commits.

As próximas seções do trabalho executam parte dessas ações prioritárias.
