export type AuthBroadcastKind = 'login' | 'logout';

const AUTH_CHANNEL_NAME = 'rm-auth';

let sharedChannel: BroadcastChannel | null = null;

function getAuthChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sharedChannel) {
    sharedChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  }
  return sharedChannel;
}

export function broadcastAuthEvent(event: AuthBroadcastKind): void {
  try {
    getAuthChannel()?.postMessage({ type: event });
  } catch {
    // Ignore channel errors if closed or unavailable.
  }
}

export function subscribeAuthEvents(handler: (event: AuthBroadcastKind) => void): () => void {
  const channel = getAuthChannel();
  if (!channel) {
    return () => undefined;
  }

  const listener = (message: MessageEvent<unknown>) => {
    const data = message.data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'type' in data &&
      (data.type === 'login' || data.type === 'logout')
    ) {
      handler(data.type);
    }
  };

  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
}
