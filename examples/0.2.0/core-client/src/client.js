import {createClient} from '@sparktide/frontend-sdk';

export function createBearerClient(loginStore) {
  return createClient({
    baseUrl: '/api/ai',
    auth: {
      type: 'bearer',
      token: () => loginStore.token,
      identityKey: () => loginStore.sessionRevision,
    },
  });
}

export function createCookieClient(loginStore) {
  return createClient({
    baseUrl: '/api/ai',
    auth: {
      type: 'cookie',
      csrfToken: () => loginStore.csrfToken,
      identityKey: () => loginStore.sessionRevision,
    },
  });
}

export function createHeaderClient(loginStore) {
  return createClient({
    baseUrl: '/api/ai',
    auth: {
      type: 'headers',
      headers: () => ({token: loginStore.token}),
      identityKey: () => loginStore.sessionRevision,
    },
  });
}

export function openChat(ai, projectId) {
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

export async function runOnce(ai) {
  const task = await ai.chat.run({message: '查询设备', agent: 'main'});
  return task.completed();
}

export async function queueFollowUp(ai, conversationId, key) {
  const capabilities = await ai.followUps.capabilities();
  if (!capabilities.modes.includes('QUEUE')) return null;
  return ai.followUps.submit(conversationId, {
    mode: 'QUEUE',
    message: '当前任务完成后再查一次',
    idempotencyKey: key,
    agent: 'main',
  });
}
