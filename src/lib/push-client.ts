"use client";

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerServiceWorker = async () => {
  const registration = await navigator.serviceWorker.register("/sw.js");
  return registration;
};

export const getVapidPublicKey = async () => {
  const response = await fetch("/api/push/public-key");
  const data = await response.json();
  if (!data?.success || !data?.publicKey) {
    throw new Error("VAPID_PUBLIC_KEY não encontrada");
  }
  return data.publicKey as string;
};

export const subscribeToPush = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão de notificações negada");
  }

  const registration =
    (await navigator.serviceWorker.getRegistration()) ||
    (await registerServiceWorker());

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return existingSubscription;
  }

  const publicKey = await getVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
};
