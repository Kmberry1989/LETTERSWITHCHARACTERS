"use client"

import * as React from "react"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const toastRefs = React.useRef<Record<string, HTMLLIElement | null>>({})

  React.useEffect(() => {
    if (toasts.length === 0) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      const clickedInsideToast = toasts.some((toast) => {
        const element = toastRefs.current[toast.id]
        return element ? element.contains(target) : false
      })

      if (!clickedInsideToast) {
        dismiss()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [dismiss, toasts])

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            ref={(node) => {
              toastRefs.current[id] = node
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
