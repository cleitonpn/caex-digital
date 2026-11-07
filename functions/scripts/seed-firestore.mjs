import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const db = getFirestore();
const seed = JSON.parse(await readFile(resolve(process.cwd(), 'firebase.seed.json'), 'utf8'));
const tenantId = seed.event.tenantId;
const eventId = seed.event.id;
const eventRef = db.doc(`tenants/${tenantId}/events/${eventId}`);

if (!(await eventRef.get()).exists) {
  const writes = [
    [`tenants/${tenantId}`, { name: seed.companies.find((item) => item.type === 'organizer')?.name ?? tenantId, active: true, bootstrapVersion: 1 }],
    [`tenants/${tenantId}/events/${eventId}`, seed.event],
    [`tenants/${tenantId}/events/${eventId}/runtime/config`, { slaPolicies: seed.slaPolicies, now: seed.now }],
    ...seed.companies.map((item) => [`tenants/${tenantId}/companies/${item.id}`, item]),
    ...seed.people.map((item) => [`tenants/${tenantId}/people/${item.id}`, item]),
    ...seed.exhibitors.map((item) => [`tenants/${tenantId}/events/${eventId}/exhibitors/${item.id}`, item]),
    ...seed.assignments.map((item) => [`tenants/${tenantId}/events/${eventId}/assignments/${item.id}`, item]),
    ...seed.tickets.map((item) => [`tenants/${tenantId}/events/${eventId}/tickets/${item.id}`, item]),
  ];
  for (let offset = 0; offset < writes.length; offset += 400) {
    const batch = db.batch();
    for (const [path, value] of writes.slice(offset, offset + 400)) batch.set(db.doc(path), value);
    await batch.commit();
  }
  console.log(`Carga inicial criada: ${writes.length} documentos em ${tenantId}/${eventId}.`);
} else {
  console.log(`Carga inicial preservada: ${tenantId}/${eventId} já existe.`);
}

try {
  const accessToken = await app.options.credential?.getAccessToken();
  if (accessToken) {
    const projectId = app.options.projectId ?? process.env.FIREBASE_PROJECT_ID;
    const authConfig = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.email`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } }),
    });
    if (!authConfig.ok) console.warn(`Não foi possível ativar login por e-mail automaticamente: HTTP ${authConfig.status}.`);
  }
  const users = (await getAuth().listUsers(1000)).users;
  const commitEmail = execFileSync('git', ['log', '-1', '--format=%ae'], { encoding: 'utf8' }).trim();
  const requestedEmail = (process.env.FIREBASE_BOOTSTRAP_ADMIN_EMAIL?.trim() || commitEmail).toLowerCase();
  let bootstrapUser = requestedEmail
    ? users.find((user) => user.email?.toLowerCase() === requestedEmail)
    : users.length === 1 ? users[0] : undefined;

  if (!bootstrapUser && users.length === 0 && requestedEmail.includes('@')) {
    bootstrapUser = await getAuth().createUser({ email: requestedEmail, displayName: 'Administrador CAEXOne' });
    console.log(`Usuário administrador criado para ${requestedEmail}; defina a senha pelo fluxo de recuperação.`);
  }

  if (bootstrapUser) {
    const claims = { ...(bootstrapUser.customClaims ?? {}), tenantId, eventId, role: 'platform_admin', companyId: tenantId };
    await getAuth().setCustomUserClaims(bootstrapUser.uid, claims);
    await db.doc(`tenants/${tenantId}/members/${bootstrapUser.uid}`).set({
      active: true,
      role: 'platform_admin',
      companyId: tenantId,
      eventIds: [eventId],
      email: bootstrapUser.email ?? null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`Administrador inicial vinculado: ${bootstrapUser.email ?? bootstrapUser.uid}.`);
  } else if (users.length === 0) {
    console.log('Nenhum usuário no Firebase Auth; crie o primeiro usuário para que ele seja vinculado no próximo deploy.');
  } else {
    console.log('Há múltiplos usuários no Auth. Defina FIREBASE_BOOTSTRAP_ADMIN_EMAIL para escolher o administrador inicial.');
  }
} catch (error) {
  console.warn(`Carga de dados concluída, mas o vínculo do administrador ficou pendente: ${error instanceof Error ? error.message : error}`);
}
