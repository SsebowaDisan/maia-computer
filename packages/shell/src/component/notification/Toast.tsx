import { motion } from 'framer-motion'

import type { ToastItem } from '../../hook/useNotifications'

interface ToastProps {
  toast: ToastItem
}

export function Toast({ toast }: ToastProps) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="w-[360px] rounded-xl border border-border bg-elevated p-4 shadow-window"
      initial={{ opacity: 0, x: 24 }}
    >
      <p className="text-sm font-semibold text-textPrimary">{toast.title}</p>
      <p className="mt-1 text-sm text-textSecondary">{toast.body}</p>
    </motion.div>
  )
}
