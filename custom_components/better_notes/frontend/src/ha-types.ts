/** Minimal HA frontend types for what this integration's frontend actually uses. */

export type UnsubscribeFunc = () => void;

export interface Connection {
  sendMessagePromise<T>(message: Record<string, unknown>): Promise<T>;
  subscribeEvents<T>(callback: (ev: T) => void, eventType: string): Promise<UnsubscribeFunc>;
}

export interface HomeAssistant {
  connection: Connection;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}
