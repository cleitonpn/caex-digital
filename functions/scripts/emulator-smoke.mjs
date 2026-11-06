import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GCLOUD_PROJECT ?? 'caex-digital-local';
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST ?? '127.0.0.1:5001';
initializeApp({ projectId });
const db = getFirestore();

async function writeDocument(path, fields) {
  await db.doc(path).set(fields);
}

async function waitForOutbox() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const [notifications, outbox] = await Promise.all([
      db.collection('tenants/demo/notifications').where('ticketId', '==', 'SMOKE-1').get(),
      db.collection('tenants/demo/notificationOutbox').where('ticketId', '==', 'SMOKE-1').get(),
    ]);
    const notification = notifications.docs[0];
    const delivery = outbox.docs[0];
    const status = delivery?.data().status;
    if (notification && delivery && status === 'attention_required') return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Notification triggers did not finish within 10 seconds.');
}

const health = await fetch(`http://${functionsHost}/${projectId}/southamerica-east1/health`);
if (!health.ok || (await health.json()).status !== 'ok') throw new Error('Health endpoint failed.');

await writeDocument('tenants/demo/people/producer-smoke', {
  name: 'Produtor Smoke',
  email: 'produtor@example.com',
  phone: '5511999999999',
});

await writeDocument('tenants/demo/events/pilot/tickets/SMOKE-1', {
  exhibitorName: 'Expositor Smoke',
  stand: 'S-01',
  priority: 'high',
  description: 'Validação do fluxo local.',
  assignedProducerId: 'producer-smoke',
});

await waitForOutbox();
console.log('Smoke OK: API, Firestore trigger, in-app notification and delivery outbox.');
