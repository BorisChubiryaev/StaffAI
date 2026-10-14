import type { Metadata } from 'next'
import './globals.css'
import { DemoProvider } from '@/lib/demo-store'

export const metadata: Metadata = {
  title: 'StaffAI — AI-платформа для привлечения IT-специалистов',
  description: 'AI-ассистируемая operational workflow platform для заказа внешних IT-специалистов',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <DemoProvider>
          {children}
        </DemoProvider>
      </body>
    </html>
  )
}
