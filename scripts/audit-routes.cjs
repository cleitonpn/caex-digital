const { chromium } = require('playwright');

const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4174/';
const routes = [
  '/', '/chamados', '/expositores', '/fornecedores', '/equipes', '/eventos',
  '/relatorios', '/usuarios', '/notificacoes', '/importar', '/configuracoes',
  '/portal', '/gestor', '/organizador/producao', '/organizador/atendimento',
  '/fornecedor', '/fornecedor/atendimento', '/fornecedor/producao',
  '/admin-plataforma', '/perfis', '/entrar',
];

async function crawl(browser, viewport, label) {
  const context = await browser.newContext({ viewport });
  const failures = [];
  for (const route of routes) {
    process.stdout.write(`${label}:${route} `);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(`console: ${message.text()}`);
    });
    const response = await page.goto(`${base}#${route}`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForFunction(() => document.body.innerText.trim().length >= 40, null, { timeout: 10_000 });
    const body = await page.locator('body').innerText();
    if (!response?.ok()) errors.push(`HTTP ${response?.status()}`);
    if (body.trim().length < 40) errors.push('conteúdo insuficiente');
    if (/Application error|Unexpected Application Error|Cannot read properties/i.test(body)) errors.push('erro de aplicação visível');
    if (errors.length) failures.push({ label, route, errors });
    await page.close();
  }
  await context.close();
  return failures;
}

async function expectVisible(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible' });
}

async function interactions(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(5_000);
  const failures = [];
  async function check(name, route, run) {
    process.stdout.write(`interaction:${name} `);
    try {
      await page.goto(`${base}#${route}`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.waitForFunction(() => document.body.innerText.trim().length >= 40, null, { timeout: 10_000 });
      await run();
    } catch (error) {
      failures.push({ label: 'interação', route: `${route} (${name})`, errors: [error.message] });
    }
  }

  await check('filtros de expositores', '/expositores', async () => {
    await page.getByRole('button', { name: /Filtros/ }).click();
    await expectVisible(page, 'Classificação interna');
  });
  await check('menu de evento', '/eventos', async () => {
    await page.getByRole('button', { name: 'Mais opções' }).first().click();
    await expectVisible(page, 'Editar evento');
    await page.getByText('Editar evento', { exact: true }).first().click();
    await expectVisible(page, 'Gerenciar evento');
  });
  await check('edição de usuário', '/usuarios', async () => {
    await page.getByRole('button', { name: /Editar / }).first().click();
    await expectVisible(page, 'Gerenciar usuário');
    await page.locator('.user-edit-modal .icon-button').click();
  });
  await check('permissões de usuário', '/usuarios', async () => {
    await page.getByRole('button', { name: /Personalizar perfis/ }).click();
    await expectVisible(page, 'Personalizar permissões');
  });
  await check('histórico do gestor', '/gestor', async () => {
    await page.getByRole('button', { name: /Ver histórico/ }).first().click();
    await expectVisible(page, 'Histórico do chamado');
  });
  await check('apoio ao produtor', '/fornecedor/producao', async () => {
    await page.getByRole('button', { name: /Pedir apoio/ }).click();
    await expectVisible(page, 'Pedir apoio ao atendimento');
  });
  await check('equipe do fornecedor', '/fornecedor', async () => {
    await page.getByRole('button', { name: /Adicionar colaborador/ }).click();
    await expectVisible(page, 'Convidar pessoa');
  });
  await check('atualização geral', '/fornecedor/atendimento', async () => {
    await page.getByRole('button', { name: /Enviar atualização geral/ }).click();
    await expectVisible(page, 'Atualização geral da operação');
  });
  await check('falar com fornecedor', '/organizador/atendimento', async () => {
    await page.getByRole('button', { name: /Falar com fornecedor/ }).first().click();
    await expectVisible(page, 'Falar com fornecedor');
    await page.locator('.quick-action-modal .icon-button').click();
  });
  await check('ficha do expositor no atendimento', '/organizador/atendimento', async () => {
    await page.locator('.relationship-list button').first().click();
    await expectVisible(page, 'FICHA DO EXPOSITOR');
  });
  await check('deslocamento do produtor', '/organizador/producao', async () => {
    await page.getByRole('button', { name: 'Ir ao stand' }).first().click();
    await expectVisible(page, 'Em deslocamento');
  });
  await check('filtro da sala de guerra', '/', async () => {
    await page.locator('.select-button select').selectOption('critical');
    await page.getByRole('button', { name: /Ver todas/ }).last().click();
    await expectVisible(page, 'Mostrar recentes');
  });
  await check('notificações do portal', '/portal', async () => {
    await page.getByRole('button', { name: 'Notificações' }).click();
    await expectVisible(page, 'Notificações');
    await page.locator('.portal-info-modal .icon-button').click();
  });
  await check('equipe do portal', '/portal', async () => {
    await page.locator('.portal-shortcuts button').nth(2).click();
    await expectVisible(page, 'Equipe responsável');
  });
  await check('relatório executivo', '/relatorios', async () => {
    await page.getByRole('button', { name: /Relatório executivo/ }).click();
  });
  await check('administração da plataforma', '/admin-plataforma', async () => {
    await page.getByRole('button', { name: /Nova organizadora/ }).click();
    await expectVisible(page, 'Nova organizadora');
  });

  await context.close();
  return failures;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
  const failures = [
    ...(await crawl(browser, { width: 1440, height: 1000 }, 'desktop')),
    ...(await crawl(browser, { width: 390, height: 844 }, 'mobile')),
    ...(await interactions(browser)),
  ];
  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log(`Auditadas ${routes.length} rotas em desktop e mobile, mais 16 fluxos interativos.`);
})();
