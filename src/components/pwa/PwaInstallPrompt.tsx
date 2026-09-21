"use client"

import React, { useState, useEffect } from "react"
import { Download, Share, PlusSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already in standalone (installed) mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true)
      return
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIos(isIosDevice)

    if (isIosDevice) {
      setIsInstallable(true)
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  if (isStandalone || !isInstallable) return null

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8 gap-1.5 shadow-sm"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">App</span>
      </Button>

      {/* iOS Manual Installation Guide Dialog */}
      <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              Instalar PITA en tu iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              Para acceder directamente desde tu pantalla de inicio como una aplicación nativa:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex items-start gap-3 rounded-lg border p-3 bg-zinc-50 dark:bg-zinc-900">
              <div className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-800 shrink-0">
                <Share className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Paso 1: Compartir</p>
                <p className="text-xs text-zinc-500">
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-3 bg-zinc-50 dark:bg-zinc-900">
              <div className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-800 shrink-0">
                <PlusSquare className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Paso 2: Agregar a Inicio</p>
                <p className="text-xs text-zinc-500">
                  Desliza hacia abajo en el menú y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowIosGuide(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
