import Vue from 'vue';
import {createClient, defineAiComponent, s, type AiClient} from '@sparktide/frontend-sdk';
import {createChatMixin, SparkTidePlugin, type ChatMixinState} from '@sparktide/frontend-sdk/vue2';
import {ChatInput, ChatPanel, MessageList} from '@sparktide/ui-basic/vue2';
import {CommonComponents} from '@sparktide/ai-components/vue2';
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
  render(props: {equipmentId: string; state: string}) {
    return props.equipmentId + '：' + props.state;
  },
});

export function createAssistant(token: () => string, identityKey: () => string | null): AiClient {
  const ai = createClient({
    baseUrl: '/api/ai',
    auth: {type: 'bearer', token, identityKey},
  });
  ai.registerComponents([equipmentStatus]);
  ai.registerComponents(CommonComponents, {include: ['genui', 'question'], locale: 'zh'});
  return ai;
}

export function install(ai: AiClient) {
  Vue.use(SparkTidePlugin, {client: ai});
  return new Vue({
    render: h => h(ChatPanel, {props: {agent: 'main'}}),
  });
}

export const CustomChat = Vue.extend({
  mixins: [createChatMixin({agent: 'main'})],
  render(this: Vue & ChatMixinState, h) {
    return h('main', [
      h(MessageList, {props: {messages: this.chatState.messages, onCitation: this.chat.previewCitation}}),
      h(ChatInput, {props: {state: this.chatState, actions: this.chat}}),
    ]);
  },
});
