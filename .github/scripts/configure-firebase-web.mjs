import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('FIREBASE_PROJECT_ID não foi preparado.');
const firebase = './node_modules/.bin/firebase';

function command(args) {
  const output = execFileSync(firebase, [...args, '--project', projectId, '--json'], { encoding: 'utf8' });
  return JSON.parse(output);
}

function findAppId(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (typeof value.appId === 'string') return value.appId;
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested)) {
      for (const item of nested) { const found = findAppId(item); if (found) return found; }
    } else {
      const found = findAppId(nested);
      if (found) return found;
    }
  }
  return undefined;
}

let appId = findAppId(command(['apps:list', 'WEB']));
if (!appId) appId = findAppId(command(['apps:create', 'WEB', 'CAEX Digital Web']));
if (!appId) throw new Error('Não foi possível localizar ou criar o aplicativo Web do Firebase.');

const response = command(['apps:sdkconfig', 'WEB', appId]);
const candidates = [response?.result?.sdkConfig, response?.result, response?.sdkConfig, response];
const config = candidates.find((item) => item && typeof item.apiKey === 'string');
if (!config) throw new Error('O Firebase não retornou a configuração do SDK Web.');

const variables = {
  VITE_DATA_MODE: 'firebase',
  VITE_FIREBASE_API_KEY: config.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
  VITE_FIREBASE_PROJECT_ID: config.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: config.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
  VITE_FIREBASE_APP_ID: config.appId ?? appId,
};
for (const [name, value] of Object.entries(variables)) {
  if (!value) throw new Error(`Configuração Firebase ausente: ${name}.`);
  appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
}
console.log(`Aplicativo Web configurado automaticamente no projeto ${projectId}.`);
