import {useEffect, useMemo} from 'react';
import type {AiClient} from '@sparktide/frontend-sdk';
import {SparkTideProvider, useChat} from '@sparktide/frontend-sdk/react';
import {ChatInput, ChatPanel, MessageList} from '@sparktide/ui-basic/react';
import '@sparktide/ui-basic/style.css';
import {createAssistant} from './client';

export function Assistant(props: {token: () => string; identityKey: () => string | null}) {
  const client = useMemo(() => createAssistant(props.token, props.identityKey), [props.token, props.identityKey]);
  useEffect(() => () => client.dispose(), [client]);
  return (
    <SparkTideProvider client={client}>
      <ChatPanel agent="main" label="业务助手" appearance="native" />
    </SparkTideProvider>
  );
}

export function CustomChat(props: {client: AiClient}) {
  const chat = useChat({client: props.client, agent: 'main'});
  return (
    <main>
      <MessageList messages={chat.messages} onCitation={chat.previewCitation} />
      <ChatInput chat={chat} />
    </main>
  );
}
