import { createServerFn } from "@tanstack/react-start";

/**
 * The Firebase web config. The apiKey is a publishable client key, but it is
 * kept in project secrets and handed to the browser at runtime.
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    apiKey: process.env["GOOGLE_API_KEY"] ?? "",
    authDomain: "devoshu-9573d.firebaseapp.com",
    projectId: "devoshu-9573d",
    storageBucket: "devoshu-9573d.firebasestorage.app",
    messagingSenderId: "252866388320",
    appId: "1:252866388320:web:5381a39294c90ca876be05",
    measurementId: "G-VTVXYRXHKV",
  };
});
