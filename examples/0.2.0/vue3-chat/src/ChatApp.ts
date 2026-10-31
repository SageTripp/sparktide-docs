import {createApp, defineComponent, h, onScopeDispose} from 'vue';
import {createClient, defineAiComponent, s, type AiClient} from '@sparktide/frontend-sdk';
import {SparkTidePlugin, useChat} from '@sparktide/frontend-sdk/vue';
import {ChatInput, ChatPanel, MessageList} from '@sparktide/ui-basic/vue';
import {CommonComponents} from '@sparktide/ai-components/vue';
import '@sparktide/ui-basic/style.css';
import '@sparktide/ai-components/style.css';

export const equipmentStatus = defineAiComponent({
  name: 'equipment.status',
  version: '1.0.0',
  description: '展示机组状态',
  fallback: '请查看文字结果。',
  props: s.object({
    equipmentId: s.string().min(1).max(64).describe('机组标识'),
    state: s.string().describe('当前状态'),
  }),
  render: defineComponent({
    props: {equipmentId: String, state: String},
    setup(props) {
      return () => h('p', `${props.equipmentId}：${props.state}`);
    },
  }),
});

export function createAssistant(token: () => string, identityKey: () => string | null): AiClient {
  const ai = createClient({
    baseUrl: '/api/ai',
    auth: {type: 'bearer', token, identityKey},
  });
  ai.registerComponents([equipmentStatus]);
  ai.registerComponents(CommonComponents, {include: ['genui', 'form', 'question'], locale: 'zh'});
  return ai;
}

export function mountPanel(ai: AiClient, element: Element) {
  const app = createApp(ChatPanel, {agent: 'main', client: ai});
  app.use(SparkTidePlugin, {client: ai});
  const mounted = app.mount(element);
  return () => {
    app.unmount();
    void mounted;
    ai.dispose();
  };
}

export const CustomChat = defineComponent({
  setup() {
    const chat = useChat(() => ({agent: 'main'}));
    onScopeDispose(() => undefined);
    return () => h('main', [
      h(MessageList, {messages: chat.messages.value, onCitation: chat.previewCitation}),
      h(ChatInput, {chat}),
    ]);
  },
});
