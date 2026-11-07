import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import cors from 'cors';
import * as functions from 'firebase-functions/v1';

initializeApp();

const db = getFirestore();
const allowCors = cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'] });
const notificationSecrets = [
  'RESEND_API_KEY',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
];

const importerRoles = new Set(['platform_admin', 'organizer_admin', 'event_manager']);

interface ImportExhibitor {
  externalId?: string;
  name: string;
  contactName: string;
  contactEmail: string;
  stand: string;
  pavilion: string;
  areaSqm: number;
  internalTier?: 'AAA' | 'AA' | 'A' | 'B' | 'C';
  projectUrl?: string | null;
  memorialUrl?: string | null;
  furniture?: Array<{ type: string; quantity: number }> | string | null;
}

interface TicketNotificationData {
  description?: string;
  exhibitorName?: string;
  stand?: string;
  priority?: string;
  assignedProducerId?: string;
  assignedServiceId?: string;
  organizerRecipientIds?: string[];
}

export const health = functions
  .region('southamerica-east1')
  .https.onRequest((request, response) => {
    allowCors(request, response, () => {
      response.status(200).json({ status: 'ok', service: 'caex-digital-api' });
    });
  });

export const importExhibitors = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .region('southamerica-east1')
  .https.onRequest((request, response) => {
    allowCors(request, response, async () => {
      try {
        if (request.method === 'OPTIONS') {
          response.status(204).send('');
          return;
        }
        if (request.method !== 'POST') {
          response.status(405).json({ error: 'method_not_allowed' });
          return;
        }

        const decoded = await authenticate(request.headers.authorization);
        const tenantId = cleanId(request.body?.tenantId);
        const eventId = cleanId(request.body?.eventId);
        const rows = request.body?.exhibitors;
        if (!tenantId || !eventId || !Array.isArray(rows) || rows.length === 0) {
          response.status(400).json({ error: 'invalid_payload' });
          return;
        }
        if (rows.length > 500) {
          response.status(400).json({ error: 'batch_limit_exceeded', max: 500 });
          return;
        }

        const membership = await db.doc(`tenants/${tenantId}/members/${decoded.uid}`).get();
        if (!membership.exists || membership.data()?.active !== true || !importerRoles.has(membership.data()?.role)) {
          response.status(403).json({ error: 'insufficient_role' });
          return;
        }

        const validated = rows.map((row: unknown, index: number) => validateExhibitor(row, index));
        const importId = db.collection(`tenants/${tenantId}/events/${eventId}/imports`).doc().id;
        const batch = db.batch();
        for (const row of validated) {
          const id = row.externalId ? cleanId(row.externalId) : slug(`${row.name}-${row.stand}`);
          const reference = db.doc(`tenants/${tenantId}/events/${eventId}/exhibitors/${id}`);
          batch.set(reference, {
            ...row,
            importId,
            active: true,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: decoded.uid,
          }, { merge: true });
        }
        batch.set(db.doc(`tenants/${tenantId}/events/${eventId}/imports/${importId}`), {
          source: 'api',
          importedBy: decoded.uid,
          rowCount: validated.length,
          createdAt: FieldValue.serverTimestamp(),
        });
        await batch.commit();

        response.status(200).json({ importId, imported: validated.length });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unexpected_error';
        const status = message.startsWith('row_') ? 400 : message === 'unauthorized' ? 401 : 500;
        response.status(status).json({ error: message });
      }
    });
  });

export const createTicketNotifications = functions
  .region('southamerica-east1')
  .firestore.document('tenants/{tenantId}/events/{eventId}/tickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as TicketNotificationData;
    const tenantId = context.params.tenantId;
    const eventId = context.params.eventId;
    const ticketId = context.params.ticketId;
    const recipientIds = [...new Set([
      data.assignedProducerId,
      data.assignedServiceId,
      ...(data.organizerRecipientIds ?? []),
    ].filter((value): value is string => Boolean(value)))];

    if (!recipientIds.length) return;
    const people = await Promise.all(recipientIds.map((id) => db.doc(`tenants/${tenantId}/people/${id}`).get()));
    const batch = db.batch();

    for (const person of people) {
      if (!person.exists) continue;
      const personData = person.data() ?? {};
      const notification = {
        tenantId,
        eventId,
        ticketId,
        recipientId: person.id,
        title: `Novo chamado ${ticketId}`,
        body: `${data.exhibitorName ?? 'Expositor'} · Stand ${data.stand ?? '—'} · ${data.priority ?? 'sem prioridade'}`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      };
      batch.set(db.collection(`tenants/${tenantId}/notifications`).doc(), notification);

      const channels: string[] = [];
      if (typeof personData.email === 'string' && personData.email) channels.push('email');
      if (typeof personData.phone === 'string' && personData.phone) channels.push('whatsapp');
      if (channels.length) {
        batch.set(db.collection(`tenants/${tenantId}/notificationOutbox`).doc(), {
          ...notification,
          toEmail: personData.email ?? null,
          toPhone: personData.phone ?? null,
          channels,
          status: 'pending',
          attempts: 0,
        });
      }
    }
    await batch.commit();
  });

export const dispatchNotification = functions
  .runWith({ secrets: notificationSecrets })
  .region('southamerica-east1')
  .firestore.document('tenants/{tenantId}/notificationOutbox/{notificationId}')
  .onCreate(async (snapshot) => {
    const data = snapshot.data();
    const channels = Array.isArray(data.channels) ? data.channels as string[] : [];
    const outcomes: Record<string, string> = {};

    if (channels.includes('email') && data.toEmail) {
      const key = safeSecret('RESEND_API_KEY');
      outcomes.email = key
        ? await sendResendEmail(key, data.toEmail, data.title, data.body)
        : 'configuration_required';
    }
    if (channels.includes('whatsapp') && data.toPhone) {
      const token = safeSecret('WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = safeSecret('WHATSAPP_PHONE_NUMBER_ID');
      outcomes.whatsapp = token && phoneNumberId
        ? await sendWhatsApp(token, phoneNumberId, data.toPhone, `${data.title}\n${data.body}`)
        : 'configuration_required';
    }

    const successful = Object.values(outcomes).length > 0 && Object.values(outcomes).every((value) => value === 'sent');
    await snapshot.ref.update({
      status: successful ? 'sent' : 'attention_required',
      outcomes,
      attempts: FieldValue.increment(1),
      processedAt: FieldValue.serverTimestamp(),
    });
  });

async function authenticate(authorization?: string) {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) throw new Error('unauthorized');
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    throw new Error('unauthorized');
  }
}

function validateExhibitor(value: unknown, index: number): ImportExhibitor {
  if (!value || typeof value !== 'object') throw new Error(`row_${index + 1}_invalid`);
  const row = value as Partial<ImportExhibitor>;
  const required = [row.name, row.contactName, row.contactEmail, row.stand, row.pavilion];
  if (required.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`row_${index + 1}_required_fields`);
  if (!String(row.contactEmail).includes('@')) throw new Error(`row_${index + 1}_invalid_email`);
  return {
    externalId: row.externalId?.trim(),
    name: row.name!.trim(),
    contactName: row.contactName!.trim(),
    contactEmail: row.contactEmail!.trim().toLowerCase(),
    stand: row.stand!.trim(),
    pavilion: row.pavilion!.trim(),
    areaSqm: Number(row.areaSqm) || 0,
    internalTier: row.internalTier ?? 'C',
    projectUrl: safeUrl(row.projectUrl),
    memorialUrl: safeUrl(row.memorialUrl),
    furniture: normalizeFurniture(row.furniture),
  };
}

function normalizeFurniture(value: ImportExhibitor['furniture']) {
  const rawItems = typeof value === 'string'
    ? value.split(/\s*[\/,]\s*/).map((entry) => {
      const match = entry.trim().match(/^(\d+)\s*(?:x\s*)?(.+)$/i);
      return match ? { quantity: Number(match[1]), type: match[2] } : { quantity: 1, type: entry };
    })
    : Array.isArray(value) ? value : [];
  return rawItems.slice(0, 100).flatMap((item) => {
    if (!item || typeof item.type !== 'string' || !item.type.trim()) return [];
    return [{
      type: item.type.trim().slice(0, 120),
      quantity: Math.min(10_000, Math.max(1, Math.round(Number(item.quantity) || 1))),
    }];
  });
}

function cleanId(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : '';
}

function slug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeSecret(name: string) {
  return process.env[name] ?? '';
}

async function sendResendEmail(key: string, to: string, subject: string, text: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'CAEX Digital <notificacoes@caex.digital>', to: [to], subject, text }),
  });
  return response.ok ? 'sent' : `failed_${response.status}`;
}

async function sendWhatsApp(token: string, phoneNumberId: string, to: string, body: string) {
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  return response.ok ? 'sent' : `failed_${response.status}`;
}
