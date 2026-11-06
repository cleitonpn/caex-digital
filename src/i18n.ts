import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pt: { translation: {
    language: 'Idioma',
    phase: { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' },
    category: { carpentry: 'Marcenaria', electrical: 'Elétrica', upholstery: 'Tapeçaria', visual_communication: 'Comunicação visual', cleaning: 'Limpeza', furniture: 'Mobiliário', landscaping: 'Paisagismo', av: 'Áudio e vídeo', ab: 'A/B' },
    status: { open: 'Aberto', accepted: 'Aceito', in_progress: 'Em atendimento', waiting: 'Aguardando', awaiting_validation: 'Aguardando validação', resolved: 'Resolvido', reopened_triage: 'Reaberto em triagem', blocked_by_provider: 'Impedimento informado', closed_not_performed: 'Não executado' },
    priority: { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' },
    home: { hello: 'Olá, Marina', tagline: 'Tudo para o seu stand em um só lugar.', standPreparing: 'Stand em preparação', stand: 'Stand {{number}}', openTicket: 'Abrir chamado', ticketStatus: 'Status dos chamados', inProgressCount: '{{count}} em andamento', resolved: 'Resolvidos', inService: 'Em atendimento', open: 'Abertos', myProject: 'Meu projeto', memorial: 'Memorial', team: 'Equipe responsável', recent: 'Chamados recentes', seeAll: 'Ver todos' },
    form: { back: 'Voltar', title: 'Novo chamado', intro: 'Selecione a categoria e descreva o que está acontecendo no stand.', cleaningTitle: 'Limpeza durante o evento', cleaningUnavailable: 'Este serviço não está contratado para o período atual.', electricalTitle: 'Atenção: risco elétrico', electricalBody: 'Em caso de cheiro de queimado, faíscas ou risco de choque, afaste as pessoas e sinalize abaixo.', describe: 'Descreva o problema *', placeholder: 'Conte o que aconteceu e onde fica o problema...', addPhotos: 'Adicionar fotos', photosHelp: 'Ajude a equipe a identificar o problema', impact: 'Qual é o impacto?', high: 'Alto', highHelp: 'Impede o funcionamento do stand', medium: 'Médio', mediumHelp: 'Prejudica parcialmente a operação', low: 'Baixo', lowHelp: 'Ajuste pontual sem impacto imediato', safety: 'Existe risco à segurança', safetyHelp: 'Faísca, fumaça, cheiro de queimado ou risco de choque', routing: 'Será encaminhado para', organizerTriage: 'triagem da organizadora', submit: 'Enviar chamado' },
    detail: { back: 'Voltar', opened: 'Aberto', accepted: 'Aceito', inService: 'Em atendimento', waiting: 'Aguardando', nextStep: 'Próxima etapa', forecast: 'Previsão de solução', inHoursMinutes: 'em {{hours}}h {{minutes}}min', inMinutes: 'em {{minutes}} min', description: 'Descrição do problema', serviceTeam: 'Equipe de atendimento', teamHelp: 'Profissionais que estão cuidando do seu chamado.', teamUpdate: 'Atualização da equipe', updateBody: 'Nossa equipe recebeu o chamado e acompanhará cada etapa por aqui.', message: 'Enviar uma mensagem...', validate: 'Validar solução' },
  } },
  en: { translation: {
    language: 'Language',
    phase: { setup: 'Setup', event: 'Event', teardown: 'Teardown' },
    category: { carpentry: 'Carpentry', electrical: 'Electrical', upholstery: 'Upholstery', visual_communication: 'Visual communication', cleaning: 'Cleaning', furniture: 'Furniture', landscaping: 'Landscaping', av: 'Audio and video', ab: 'A/B' },
    status: { open: 'Open', accepted: 'Accepted', in_progress: 'In service', waiting: 'Waiting', awaiting_validation: 'Awaiting validation', resolved: 'Resolved', reopened_triage: 'Reopened in triage', blocked_by_provider: 'Provider issue reported', closed_not_performed: 'Not performed' },
    priority: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
    home: { hello: 'Hello, Marina', tagline: 'Everything for your booth in one place.', standPreparing: 'Booth being prepared', stand: 'Booth {{number}}', openTicket: 'Open a request', ticketStatus: 'Request status', inProgressCount: '{{count}} in progress', resolved: 'Resolved', inService: 'In service', open: 'Open', myProject: 'My project', memorial: 'Specifications', team: 'Support team', recent: 'Recent requests', seeAll: 'See all' },
    form: { back: 'Back', title: 'New request', intro: 'Select a category and describe what is happening at the booth.', cleaningTitle: 'Cleaning during the event', cleaningUnavailable: 'This service is not contracted for the current period.', electricalTitle: 'Warning: electrical hazard', electricalBody: 'If you notice a burning smell, sparks, or shock risk, move people away and flag it below.', describe: 'Describe the issue *', placeholder: 'Tell us what happened and where the issue is located...', addPhotos: 'Add photos', photosHelp: 'Help the team identify the issue', impact: 'What is the impact?', high: 'High', highHelp: 'Prevents the booth from operating', medium: 'Medium', mediumHelp: 'Partially affects operations', low: 'Low', lowHelp: 'Minor adjustment with no immediate impact', safety: 'There is a safety risk', safetyHelp: 'Sparks, smoke, burning smell, or shock risk', routing: 'This will be sent to', organizerTriage: 'organizer triage', submit: 'Send request' },
    detail: { back: 'Back', opened: 'Open', accepted: 'Accepted', inService: 'In service', waiting: 'Waiting', nextStep: 'Next step', forecast: 'Estimated resolution', inHoursMinutes: 'in {{hours}}h {{minutes}}min', inMinutes: 'in {{minutes}} min', description: 'Issue description', serviceTeam: 'Support team', teamHelp: 'The professionals handling your request.', teamUpdate: 'Team update', updateBody: 'Our team has received the request and will share each update here.', message: 'Send a message...', validate: 'Confirm resolution' },
  } },
  es: { translation: {
    language: 'Idioma',
    phase: { setup: 'Montaje', event: 'Evento', teardown: 'Desmontaje' },
    category: { carpentry: 'Carpintería', electrical: 'Electricidad', upholstery: 'Tapicería', visual_communication: 'Comunicación visual', cleaning: 'Limpieza', furniture: 'Mobiliario', landscaping: 'Paisajismo', av: 'Audio y video', ab: 'A/B' },
    status: { open: 'Abierto', accepted: 'Aceptado', in_progress: 'En atención', waiting: 'En espera', awaiting_validation: 'Esperando validación', resolved: 'Resuelto', reopened_triage: 'Reabierto en triaje', blocked_by_provider: 'Impedimento informado', closed_not_performed: 'No realizado' },
    priority: { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' },
    home: { hello: 'Hola, Marina', tagline: 'Todo para tu stand en un solo lugar.', standPreparing: 'Stand en preparación', stand: 'Stand {{number}}', openTicket: 'Abrir solicitud', ticketStatus: 'Estado de las solicitudes', inProgressCount: '{{count}} en curso', resolved: 'Resueltas', inService: 'En atención', open: 'Abiertas', myProject: 'Mi proyecto', memorial: 'Especificaciones', team: 'Equipo responsable', recent: 'Solicitudes recientes', seeAll: 'Ver todas' },
    form: { back: 'Volver', title: 'Nueva solicitud', intro: 'Selecciona la categoría y describe lo que ocurre en el stand.', cleaningTitle: 'Limpieza durante el evento', cleaningUnavailable: 'Este servicio no está contratado para el período actual.', electricalTitle: 'Atención: riesgo eléctrico', electricalBody: 'Si hay olor a quemado, chispas o riesgo de descarga, aleja a las personas y señálalo abajo.', describe: 'Describe el problema *', placeholder: 'Cuéntanos qué ocurrió y dónde se encuentra el problema...', addPhotos: 'Añadir fotos', photosHelp: 'Ayuda al equipo a identificar el problema', impact: '¿Cuál es el impacto?', high: 'Alto', highHelp: 'Impide el funcionamiento del stand', medium: 'Medio', mediumHelp: 'Afecta parcialmente la operación', low: 'Bajo', lowHelp: 'Ajuste puntual sin impacto inmediato', safety: 'Existe un riesgo de seguridad', safetyHelp: 'Chispas, humo, olor a quemado o riesgo de descarga', routing: 'Se enviará a', organizerTriage: 'triaje de la organizadora', submit: 'Enviar solicitud' },
    detail: { back: 'Volver', opened: 'Abierto', accepted: 'Aceptado', inService: 'En atención', waiting: 'En espera', nextStep: 'Siguiente etapa', forecast: 'Previsión de solución', inHoursMinutes: 'en {{hours}}h {{minutes}}min', inMinutes: 'en {{minutes}} min', description: 'Descripción del problema', serviceTeam: 'Equipo de atención', teamHelp: 'Profesionales que están atendiendo tu solicitud.', teamUpdate: 'Actualización del equipo', updateBody: 'Nuestro equipo recibió la solicitud y compartirá cada avance aquí.', message: 'Enviar un mensaje...', validate: 'Validar solución' },
  } },
} as const;

const storedLanguage = localStorage.getItem('caex-language');
const browserLanguage = navigator.language.split('-')[0];
const initialLanguage = storedLanguage ?? (['pt', 'en', 'es'].includes(browserLanguage) ? browserLanguage : 'pt');
document.documentElement.lang = initialLanguage === 'pt' ? 'pt-BR' : initialLanguage;

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'pt',
  supportedLngs: ['pt', 'en', 'es'],
  interpolation: { escapeValue: false },
});

export default i18n;
