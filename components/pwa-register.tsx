"use client"

import { useEffect } from "react"

// Nettoie les anciens service workers / caches qui pouvaient servir
// des versions obsoletes du site (template, page...).
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister())
      })
    }
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
    }
  }, [])

  return null
}
