import {createApp, defineComponent, h, shallowRef} from 'vue';
import {createChatClient, type ChatClient} from '@sparktide/frontend-sdk';
import {ChatPanel} from '@sparktide/frontend-sdk/vue';
import './style.css';
const App = defineComponent({setup() {
  const token = shallowRef('');
  const client = shallowRef<ChatClient>();
  return () => h('main', [h('h1','我的第一个业务助手'), client.value ? h('div', [
    h('button',{onClick:() => {client.value = undefined; token.value = '';}},'退出本地登录'),
    h(ChatPanel,{client:client.value,label:'业务助手'})
  ]) : h('form',{onSubmit:(event:Event) => {
    event.preventDefault();
    const businessToken = token.value.trim();
    if (businessToken) client.value = createChatClient({baseUrl:'/api/ai',token:() => businessToken});
  }},[
    h('label',['本地业务登录令牌',h('input',{type:'password',autocomplete:'off',required:true,
      value:token.value,onInput:(event:Event) => {token.value=(event.target as HTMLInputElement).value;}})]),
    h('p','使用 .local/browser-token.txt；平台管理员与 USER 凭据留在后台。'),
    h('button','连接助手')
  ])]);
}});
createApp(App).mount('#app');
