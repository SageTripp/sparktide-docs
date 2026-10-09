import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {createChatClient, type ChatClient} from '@sparktide/frontend-sdk';
import {ChatPanel} from '@sparktide/frontend-sdk/react';
import './style.css';
function App() {
  const [token, setToken] = useState('');
  const [client, setClient] = useState<ChatClient>();
  return <main><h1>我的第一个业务助手</h1>{client ? <>
    <button onClick={() => {setClient(undefined); setToken('');}}>退出本地登录</button>
    <ChatPanel client={client} label="业务助手"/>
  </> : <form onSubmit={event => {
    event.preventDefault();
    const businessToken = token.trim();
    if (businessToken) setClient(createChatClient({baseUrl:'/api/ai', token:() => businessToken}));
  }}>
    <label>本地业务登录令牌<input type="password" autoComplete="off" value={token}
      onChange={event => setToken(event.target.value)} required/></label>
    <p>使用 .local/browser-token.txt；平台管理员与 USER 凭据留在后台。</p>
    <button>连接助手</button>
  </form>}</main>;
}
createRoot(document.getElementById('app')!).render(<App/>);
