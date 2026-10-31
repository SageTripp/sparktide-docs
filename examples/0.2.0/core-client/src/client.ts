import {createClient, type AiClient, type FollowUpMode} from '@sparktide/frontend-sdk';

export interface LoginStore {
  token: string;
  csrfToken: string;
  sessionRevision: string | null;
}

export function createBearerClient(loginStore: LoginStore): AiClient {
  return createClient({
    baseUrl: '/api/ai',
    auth: {
      type: 'bearer',
      token: () => loginStore.token,
      identityKey: () => loginStore.sessionRevision,
    },
  });
}

export function createCookieClient(loginStore: LoginStore): AiClient {
  return createClient({
    baseUrl: '/api/ai',
    auth: {
      type: 'cookie',
      csrfToken: () => loginStore.csrfToken,
      identityKey: () => loginStore.sessionRevision,
    },
  });
}

export function createHeaderClient(loginStore: LoginStore): AiClient {
  return createClient({
    baseUrl: '/api/ai',
    auth: {
      type: 'headers',
      headers: () => ({token: loginStore.token}),
      identityKey: () => loginStore.sessionRevision,
    },
  });
}

export function openChat(ai: AiClient, projectId: string) {
  const chat = ai.createChat({
    agent: 'main',
    context: () => ({projectId}),
  });
  const off = chat.subscribe(() => undefined);
  chat.start();
  chat.setInput('查询设备');
  chat.send();
  return {chat, stop() { off(); chat.dispose(); }};
}

export async function runOnce(ai: AiClient) {
  const task = await ai.chat.run({message: '查询设备', agent: 'main'});
  return task.completed();
}

export async function queueFollowUp(ai: AiClient, conversationId: string, key: string) {
  const capabilities = await ai.followUps.capabilities();
  if (!capabilities.modes.includes('QUEUE')) return null;
  const mode: FollowUpMode = 'QUEUE';
  return ai.followUps.submit(conversationId, {
    mode,
    message: '当前任务完成后再查一次',
    idempotencyKey: key,
    agent: 'main',
  });
}
