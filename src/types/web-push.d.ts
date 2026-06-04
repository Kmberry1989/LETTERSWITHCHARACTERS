declare module 'web-push' {
  export type PushSubscription = {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };

  export type SendResult = {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: string;
  };

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(subscription: PushSubscription, payload?: string): Promise<SendResult>;

  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
  };

  export default webpush;
}
