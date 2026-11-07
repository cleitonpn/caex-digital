import { appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error('O secret FIREBASE_SERVICE_ACCOUNT não foi configurado.');
let credentials;
try {
  credentials = JSON.parse(raw);
} catch {
  try {
    credentials = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    throw new Error('O secret FIREBASE_SERVICE_ACCOUNT deve conter o JSON da conta de serviço ou esse JSON codificado em base64.');
  }
}
if (!credentials.project_id) throw new Error('A conta de serviço não contém project_id.');
const credentialsPath = join(process.env.RUNNER_TEMP, 'firebase-service-account.json');
writeFileSync(credentialsPath, JSON.stringify(credentials), { mode: 0o600 });
appendFileSync(process.env.GITHUB_ENV, `GOOGLE_APPLICATION_CREDENTIALS=${credentialsPath}\n`);
appendFileSync(process.env.GITHUB_ENV, `FIREBASE_PROJECT_ID=${credentials.project_id}\n`);
