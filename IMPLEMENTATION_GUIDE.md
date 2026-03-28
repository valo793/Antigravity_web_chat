# Antigravity Chat - Guia de Implementação

## Visão Geral

Este documento fornece instruções completas para implementar o dashboard **Antigravity Chat** no Supabase e finalizar as funcionalidades pendentes. O projeto é um chat privado brutalist tipográfico para gerenciar conversas com agentes Antigravity.

## Arquitetura Implementada

### Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express.js + tRPC 11 + Node.js
- **Banco de Dados**: MySQL/TiDB (via Manus)
- **Autenticação**: Manus OAuth (restrita ao proprietário)
- **Armazenamento**: S3 para arquivos
- **Deployment**: Vercel

### Estrutura de Banco de Dados

O schema SQL foi criado com 8 tabelas principais:

| Tabela | Propósito | Campos Principais |
|--------|-----------|------------------|
| `users` | Usuários autenticados | id, openId, email, name, role, lastSignedIn |
| `agents` | Agentes/sistemas remetentes | id, name, slug, sourceType, isActive, webhookSecret |
| `conversations` | Threads de conversa | id, userId, title, externalThreadId, agentId, unreadCount |
| `messages` | Mensagens individuais | id, conversationId, senderType, content, contentFormat, status |
| `attachments` | Arquivos anexados | id, messageId, fileName, fileSize, s3Key, s3Url |
| `notifications` | Notificações de eventos | id, userId, conversationId, messageId, kind, isRead |
| `webhookEvents` | Log de webhooks recebidos | id, source, eventId, payload, processingStatus, errorMessage |
| `userPreferences` | Preferências do usuário | userId, theme, notificationSound, desktopToastEnabled |

### Índices Criados

Foram criados índices para otimizar queries frequentes:

```sql
CREATE INDEX conversations_userId_idx ON conversations (userId);
CREATE INDEX conversations_externalThreadId_idx ON conversations (externalThreadId);
CREATE INDEX conversations_lastMessageAt_idx ON conversations (lastMessageAt);
CREATE INDEX messages_conversationId_idx ON messages (conversationId);
CREATE INDEX messages_createdAt_idx ON messages (createdAt);
CREATE INDEX messages_externalMessageId_idx ON messages (externalMessageId);
CREATE INDEX notifications_userId_idx ON notifications (userId);
CREATE INDEX notifications_isRead_idx ON notifications (isRead);
CREATE INDEX webhookEvents_eventId_idx ON webhookEvents (eventId);
CREATE INDEX webhookEvents_source_idx ON webhookEvents (source);
```

## Implementação no Supabase

### 1. Configuração Inicial

Se estiver usando Supabase em vez do Manus (MySQL), adapte o schema para PostgreSQL:

```sql
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar tabelas com tipos PostgreSQL
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ... (adaptar demais tabelas para PostgreSQL)
```

### 2. Row Level Security (RLS)

Implemente RLS para isolar dados por usuário:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Política para conversations: usuário vê apenas suas conversas
CREATE POLICY conversations_select ON conversations
  FOR SELECT USING (userId = auth.uid());

CREATE POLICY conversations_insert ON conversations
  FOR INSERT WITH CHECK (userId = auth.uid());

-- Política para messages: usuário vê mensagens de suas conversas
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    conversationId IN (
      SELECT id FROM conversations WHERE userId = auth.uid()
    )
  );

-- Política para notifications: usuário vê apenas suas notificações
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (userId = auth.uid());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (userId = auth.uid());
```

### 3. Realtime Subscriptions

Configure o Supabase Realtime para atualizações em tempo real:

```typescript
// No cliente React
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Inscrever-se em mudanças de mensagens
supabase
  .channel(`conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversationId=eq.${conversationId}`,
    },
    (payload) => {
      // Atualizar UI com nova mensagem
      setMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

## API Routes Implementadas

### Autenticação

- **GET `/api/auth/me`**: Retorna usuário autenticado
- **GET `/api/auth/isOwner`**: Verifica se é proprietário
- **POST `/api/auth/logout`**: Faz logout

### Chat

- **GET `/api/chat/conversations`**: Lista conversas do usuário
- **GET `/api/chat/conversation/:id`**: Obtém conversa com mensagens
- **GET `/api/chat/messages/:conversationId`**: Pagina mensagens
- **POST `/api/chat/send`**: Envia mensagem do usuário

### Notificações

- **GET `/api/notifications`**: Lista notificações
- **GET `/api/notifications/unread-count`**: Conta não lidas
- **POST `/api/notifications/:id/read`**: Marca como lida
- **POST `/api/notifications/read-multiple`**: Marca múltiplas como lidas

### Webhooks

- **POST `/api/webhooks/antigravity`**: Recebe eventos do Antigravity

## Webhook Antigravity

### Validação de Assinatura

O webhook valida assinatura HMAC SHA-256:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Formato de Payload

```json
{
  "eventId": "evt_01HXYZ",
  "eventType": "response_ready",
  "agentSlug": "planner",
  "externalThreadId": "thread_abc123",
  "timestamp": "2026-03-28T21:10:00Z",
  "userRef": "user_internal_001",
  "message": {
    "externalMessageId": "msg_777",
    "senderType": "agent",
    "senderLabel": "Planner Agent",
    "content": "Sua resposta foi concluída com sucesso.",
    "contentFormat": "text"
  },
  "metadata": {
    "request_summary": "Planejamento de automação",
    "priority": "normal"
  }
}
```

### Deduplicação

Eventos são deduplicados por `eventId` para evitar processamento duplicado:

```typescript
const existingEvent = await getWebhookEventByEventId(event.eventId);
if (existingEvent && existingEvent.processingStatus === "success") {
  return { success: true, message: "Event already processed" };
}
```

## Upload de Arquivos (S3)

### Configuração

Use os helpers pré-configurados no template:

```typescript
import { storagePut, storageGet } from "./server/storage";

// Upload de arquivo
const { url } = await storagePut(
  `conversations/${conversationId}/file-${randomId()}.pdf`,
  fileBuffer,
  "application/pdf"
);

// Obter URL presignada
const { url } = await storageGet(`conversations/${conversationId}/file.pdf`);
```

### Armazenamento de Metadados

Salve metadados no banco:

```typescript
await createAttachment({
  messageId: messageId,
  fileName: "documento.pdf",
  fileSize: fileBuffer.length,
  mimeType: "application/pdf",
  s3Key: "conversations/conv123/file-abc.pdf",
  s3Url: "https://cdn.../file-abc.pdf",
});
```

## Notificações ao Proprietário

Use o helper `notifyOwner` para alertas operacionais:

```typescript
import { notifyOwner } from "./server/_core/notification";

// Quando nova conversa inicia
await notifyOwner({
  title: "Nova conversa iniciada",
  content: `Conversa com ${agent.name} foi iniciada via webhook`,
});

// Quando mensagem crítica chega
if (event.eventType === "error") {
  await notifyOwner({
    title: "Erro do agente",
    content: event.message.content,
  });
}
```

## Design System Brutalist

### Cores

- **Primário**: Preto puro (`oklch(0 0 0)`)
- **Fundo**: Branco pristino (`oklch(1 0 0)`)
- **Acentos**: Cinzas em escala de contraste
- **Sem arredondamento**: Bordas quadradas (`--radius: 0rem`)

### Tipografia

- **Font**: Inter (sans-serif pesada)
- **Headings**: Peso 900 (black), tamanho massivo, espaçamento negativo
- **Body**: Peso 400, line-height 1.6
- **Labels**: Peso 700, uppercase, tracking 0.05em

### Elementos Geométricos

- **Linhas grossas**: 3-4px de espessura
- **Colchetes**: Bordas top/bottom em elementos
- **Assimetria**: Grid 1fr 2fr para layout
- **Espaço negativo**: Abundante ao redor de texto

### Classes Utilitárias

```html
<!-- Underline brutalist -->
<h2 class="brutalist-underline">Título com linha</h2>

<!-- Bracket (linhas top/bottom) -->
<div class="brutalist-bracket">Conteúdo com moldura</div>

<!-- Left border accent -->
<div class="brutalist-left-border">Destaque lateral</div>

<!-- Tipografia em escala -->
<h1 class="text-brutalist-h1">Título Massivo</h1>
<p class="text-brutalist-body">Parágrafo normal</p>

<!-- Componentes -->
<button class="btn-brutalist">Ação</button>
<div class="card-brutalist">Card com borda</div>
<span class="badge-brutalist">Badge</span>
```

## Funcionalidades Pendentes

### 1. Frontend - Páginas React

As seguintes páginas precisam ser implementadas em `client/src/pages/`:

- **Dashboard.tsx**: Layout principal com sidebar
- **ChatList.tsx**: Listagem de conversas com badges de não lidas
- **ChatThread.tsx**: Visualização de thread com mensagens
- **Notifications.tsx**: Página de notificações
- **Settings.tsx**: Configurações de integração
- **Login.tsx**: Página de login (redireciona para Manus OAuth)

### 2. Frontend - Componentes

Componentes reutilizáveis em `client/src/components/`:

- **Sidebar.tsx**: Navegação lateral
- **Topbar.tsx**: Barra superior com perfil e logout
- **MessageBubble.tsx**: Bolha de mensagem (user/agent/system)
- **ConversationItem.tsx**: Item na lista de conversas
- **NotificationBell.tsx**: Ícone com badge de notificações
- **MessageComposer.tsx**: Input para enviar mensagens
- **FileUploadZone.tsx**: Zona de upload de arquivos

### 3. Integração Realtime

Implementar Supabase Realtime em componentes:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversationId=eq.${conversationId}`,
    }, payload => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => channel.unsubscribe();
}, [conversationId]);
```

### 4. Upload de Arquivos

Implementar upload com progresso:

```typescript
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversationId', conversationId);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const { attachmentId, url } = await response.json();
  
  // Incluir attachment na mensagem
  await sendMessage({
    content: message,
    attachmentIds: [attachmentId],
  });
};
```

### 5. Testes

Escrever testes vitest em `server/*.test.ts`:

- **auth.test.ts**: Testes de autenticação e autorização
- **webhook.test.ts**: Testes de validação de webhook e deduplicação
- **chat.test.ts**: Testes de CRUD de conversas e mensagens
- **notifications.test.ts**: Testes de notificações

Exemplo:

```typescript
import { describe, it, expect } from 'vitest';
import { verifyWebhookSignature } from '../lib/webhook/verify-signature';

describe('Webhook Signature', () => {
  it('should verify valid signature', () => {
    const payload = '{"test": true}';
    const secret = 'my-secret';
    const signature = 'sha256=...'; // HMAC SHA-256

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should reject invalid signature', () => {
    expect(verifyWebhookSignature('payload', 'invalid', 'secret')).toBe(false);
  });
});
```

### 6. Configuração de Ambiente

Adicionar variáveis de ambiente necessárias:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVER_KEY=your-server-key
SUPABASE_DB_URL=postgresql://user:password@host/db

# Antigravity Webhook
ANTIGRAVITY_WEBHOOK_SECRET=your-webhook-secret
ANTIGRAVITY_ALLOWED_SOURCE=antigravity-core

# S3/Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket

# OAuth
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your-app-id
```

## Deployment na Vercel

### Passos

1. **Conectar repositório Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Configurar no Vercel**:
   - Importar projeto no Vercel
   - Definir variáveis de ambiente
   - Build command: `pnpm build`
   - Output directory: `dist`

3. **Testar webhook**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/webhooks/antigravity \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Signature: sha256=..." \
     -d '{"eventId":"test","eventType":"response_ready",...}'
   ```

## Checklist de Conclusão

- [ ] Schema SQL aplicado ao banco
- [ ] Autenticação testada (apenas owner pode fazer login)
- [ ] Páginas React implementadas
- [ ] Componentes reutilizáveis criados
- [ ] Realtime Supabase integrado
- [ ] Upload de arquivos funcionando
- [ ] Webhook Antigravity recebendo eventos
- [ ] Notificações ao proprietário funcionando
- [ ] Testes vitest escritos e passando
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy na Vercel testado
- [ ] Webhook validando assinatura corretamente
- [ ] Deduplicação de eventos funcionando

## Suporte e Troubleshooting

### Webhook não recebendo eventos

1. Verificar se URL está correta: `https://your-app.vercel.app/api/webhooks/antigravity`
2. Validar assinatura HMAC no header `X-Webhook-Signature`
3. Verificar logs em `webhookEvents` table
4. Testar com curl: `curl -X POST https://your-app.vercel.app/api/webhooks/antigravity -d '...'`

### Mensagens não aparecendo em tempo real

1. Verificar se Realtime está habilitado no Supabase
2. Confirmar que RLS policies permitem leitura
3. Verificar console do navegador para erros de conexão
4. Testar subscription manualmente no Supabase Studio

### Autenticação falhando

1. Verificar se `VITE_APP_ID` está correto
2. Confirmar que `OAUTH_SERVER_URL` é acessível
3. Testar callback em `/api/oauth/callback`
4. Verificar cookies no navegador

## Próximos Passos

1. Implementar todas as páginas React listadas em "Funcionalidades Pendentes"
2. Criar componentes reutilizáveis com design brutalist
3. Integrar Realtime do Supabase
4. Testar webhook com eventos reais do Antigravity
5. Implementar upload de arquivos
6. Escrever e executar testes
7. Deploy na Vercel
8. Monitorar logs e performance

## Referências

- [Supabase Docs](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com)
- [Drizzle ORM](https://orm.drizzle.team)

---

**Última atualização**: 28 de Março de 2026
**Status**: Pronto para implementação das páginas React e componentes
