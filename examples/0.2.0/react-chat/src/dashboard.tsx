import type {AiClient} from '@sparktide/frontend-sdk';
import {ChatPanel} from '@sparktide/ui-dashboard/react';
import '@sparktide/ui-dashboard/style.css';

export function DashboardAssistant(props: {client: AiClient}) {
  return <ChatPanel client={props.client} agent="main" label="业务助手" appearance="dark" />;
}
