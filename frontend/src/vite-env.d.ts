/// <reference types="vite/client" />

declare global {
  interface Window {
    emailjs: {
      send: (
        serviceId: string,
        templateId: string,
        templateParams: Record<string, unknown>,
        userId: string
      ) => Promise<unknown>;
    };
  }
}

export {};
