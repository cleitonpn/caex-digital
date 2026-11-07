# CAEX Digital

Plataforma web responsiva para centralizar a operação de montagem, evento e desmontagem de feiras. O primeiro marco funciona inteiramente em modo demonstração local e não exige um projeto Firebase.

## Executar localmente

Requisitos: Node.js 24+ e Java 21+ para os emuladores.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. A aplicação inicia com dados fictícios persistidos no `localStorage`. Use **Configurações → Restaurar demonstração** para recuperar o estado inicial.

Rotas principais:

- `#/entrar`: entrada white label
- `#/perfis`: seletor de perfis da demonstração
- `#/`: Sala de Guerra
- `#/chamados`: gestão e ciclo dos chamados
- `#/eventos`: portfólio, preparação e histórico de eventos
- `#/expositores`: stands, documentos e classificação interna
- `#/fornecedores`: fornecedores e matriz de responsabilidade
- `#/equipes`: produtores, atendimentos e cobertura de ausência
- `#/relatorios`: indicadores, ranking de fornecedores e exportação CSV
- `#/usuarios`: usuários, acessos e matriz de permissões
- `#/notificacoes`: alertas, escalonamentos e preferências de canais
- `#/importar`: importação em lote por CSV
- `#/configuracoes`: períodos operacionais e SLA
- `#/portal`: portal white label do expositor
- `#/gestor`: painel executivo do gestor da feira
- `#/organizador/producao`: operação em campo da organizadora
- `#/organizador/atendimento`: central de atendimento da organizadora
- `#/fornecedor`: administração da empresa fornecedora
- `#/fornecedor/atendimento`: coordenação de chamados do fornecedor
- `#/fornecedor/producao`: fila de campo do produtor do fornecedor
- `#/admin-plataforma`: administração multi-tenant do CAEXOne

O mapeamento completo entre papéis, telas e capacidades está em [`docs/SCREEN_INVENTORY.md`](docs/SCREEN_INVENTORY.md).

## Firebase local

O frontend não depende do Firebase para o modo demonstração. Para desenvolver autenticação, Firestore, Storage e Cloud Functions com serviços locais:

```bash
cp .env.example .env.local
npm run emulators:fresh
```

Em outro terminal, mantenha `npm run dev` ativo. O projeto local usado pelos emuladores é `caex-digital-local`; não é preciso criar esse projeto no console do Firebase.

As Functions incluem a API autenticada de importação em lote, geração de notificações no aplicativo e uma fila de entrega preparada para Resend e WhatsApp Cloud API. As credenciais externas não são necessárias no desenvolvimento local; sem elas, a fila registra `configuration_required` sem tentar um envio real.

Para validar API, trigger do Firestore e fila de notificações de uma só vez:

```bash
npm run emulators:smoke
```

Quando um projeto real for criado, preencha as variáveis `VITE_FIREBASE_*` em `.env.local`. O módulo `src/services/firebase.ts` conecta automaticamente aos emuladores no desenvolvimento quando `VITE_USE_FIREBASE_EMULATORS=true`.

## Publicação no Firebase

O workflow [`.github/workflows/firebase.yml`](.github/workflows/firebase.yml) valida o projeto e publica regras, índices, Storage e as Functions prontas sempre que o backend muda na branch `main`. Ele usa o secret de repositório `FIREBASE_SERVICE_ACCOUNT`, que aceita tanto o JSON original da conta de serviço quanto esse JSON codificado em base64.

Para o GitHub Pages usar autenticação real, cadastre estas **Actions variables** no repositório:

- `VITE_DATA_MODE=firebase`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Sem essas variáveis, a publicação continua funcionando no modo demonstração. As notificações externas ficam na fila até que `RESEND_API_KEY`, `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` sejam cadastrados como secrets do Firebase; as notificações dentro do aplicativo continuam disponíveis.

## Regras já implementadas

- Períodos independentes de montagem, evento e desmontagem, com data e hora.
- Intervalos sem fase operacional ativa e validação de sobreposição.
- Matriz de responsabilidade por expositor, categoria e fase.
- Limpeza da montagem atribuída à montadora.
- Limpeza do evento atribuída ao fornecedor contratado e bloqueada para o expositor sem contratação.
- Categorias: marcenaria, elétrica, tapeçaria, comunicação visual, limpeza, mobiliário, paisagismo, áudio e vídeo e A/B.
- Prioridade por segurança, impacto, fase, proximidade da abertura, espera, reabertura e classificação interna.
- Categoria informada preservada separadamente da causa real encontrada.
- SLA de aceite, resolução e escalonamento por prioridade.
- Cobertura por produtor secundário quando o principal está ausente.
- Portal white label em português, inglês e espanhol, com preferência de idioma persistida no navegador.
- Gestão de múltiplos eventos, incluindo criação de rascunhos e acompanhamento da preparação.
- Relatórios executivos com SLA, tempos médios, categorias e score de fornecedores.
- Administração de usuários com escopo por organizadora, fornecedor ou expositor.
- Central de notificações com alertas críticos e preferências para aplicativo, e-mail e WhatsApp.
- Cadastro de fornecedores, contatos, especialidades, equipe e cobertura de plantão.
- QR Code real para acesso direto ao portal white label de cada expositor.
- Abertura de chamados pela organizadora com roteamento, impacto, segurança e evidências.
- Ficha completa do expositor com edição, documentos, chamados e responsabilidades.
- Editor da matriz por montagem, evento e desmontagem, incluindo contratação e equipe responsável.
- Gestão do chamado com atualizações, transferência de produtor, interceptação e reabertura para triagem.
- Configuração editável de SLA e identidade white-label com pré-visualização.

## API de importação

`POST /importExhibitors` aceita no máximo 500 expositores por requisição. O cabeçalho deve conter um Firebase ID token (`Authorization: Bearer ...`) e o usuário precisa ser membro ativo da organizadora com função `platform_admin`, `organizer_admin` ou `event_manager`.

O corpo segue este formato:

```json
{
  "tenantId": "organizadora-id",
  "eventId": "evento-id",
  "exhibitors": [
    {
      "externalId": "cliente-123",
      "name": "Empresa Expositora",
      "contactName": "Nome do responsável",
      "contactEmail": "responsavel@empresa.com",
      "stand": "B124",
      "pavilion": "Pavilhão 2",
      "areaSqm": 48,
      "internalTier": "AAA",
      "projectUrl": "https://drive.google.com/...",
      "memorialUrl": "https://drive.google.com/...",
      "furniture": [
        { "quantity": 3, "type": "cadeiras DKR" },
        { "quantity": 1, "type": "mesa DKR" },
        { "quantity": 1, "type": "TV de 43pol" }
      ]
    }
  ]
}
```

No modelo CSV, a coluna `mobiliario` reúne os itens em uma única célula. Use `/` ou vírgula para separar cada item e informe a quantidade no início, por exemplo: `3 cadeiras DKR / 1 mesa DKR / 1 lixeira / 1 TV de 43pol`.

## Verificação

```bash
npm test
npm run build:all
npm run emulators:smoke
```

Os dados da demonstração são fictícios. Nenhum dado do Firestore de produção do aplicativo anterior é utilizado neste marco.
