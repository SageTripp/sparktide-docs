import {createClient, defineAiComponent, s, type AiClient} from '@sparktide/frontend-sdk';
import {CommonComponents} from '@sparktide/ai-components/react';

export const equipmentStatus = defineAiComponent({
  name: 'equipment.status',
  version: '1.0.0',
  description: '展示机组状态',
  fallback: '请查看文字结果。',
  props: s.object({
    equipmentId: s.string().min(1).max(64).describe('机组标识'),
    state: s.string().describe('当前状态'),
  }),
  render: (props) => `${props.equipmentId}：${props.state}`,
});

export function createAssistant(token: () => string, identityKey: () => string | null): AiClient {
  const ai = createClient({
    baseUrl: '/api/ai',
    auth: {type: 'bearer', token, identityKey},
  });
  ai.registerComponents([equipmentStatus]);
  ai.registerComponents(CommonComponents, {
    include: ['genui', 'form', 'question'],
    appearance: 'auto',
    locale: 'zh',
  });
  return ai;
}

export async function queueFollowUp(ai: AiClient, conversationId: string, key: string) {
  const capabilities = await ai.followUps.capabilities();
  if (!capabilities.modes.includes('QUEUE')) return null;
  return ai.followUps.submit(conversationId, {
    mode: 'QUEUE',
    message: '当前任务完成后再查一次',
    idempotencyKey: key,
    agent: 'main',
  });
}
