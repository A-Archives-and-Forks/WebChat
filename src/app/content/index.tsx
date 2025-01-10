import React from 'react'
import { createRoot } from 'react-dom/client'
import { Remesh } from 'remesh'
import { RemeshRoot, RemeshScope } from 'remesh-react'
// import { RemeshLogger } from 'remesh-logger'
import { defineContentScript } from 'wxt/sandbox'
import { createShadowRootUi } from 'wxt/client'

import App from './App'
import { LocalStorageImpl, IndexDBStorageImpl, BrowserSyncStorageImpl } from '@/domain/impls/Storage'
import { DanmakuImpl } from '@/domain/impls/Danmaku'
import { NotificationImpl } from '@/domain/impls/Notification'
import { ToastImpl } from '@/domain/impls/Toast'
import { ChatRoomImpl } from '@/domain/impls/ChatRoom'
import { VirtualRoomImpl } from '@/domain/impls/VirtualRoom'
// Remove import after merging: https://github.com/emilkowalski/sonner/pull/508
import 'sonner/dist/styles.css'
import '@/assets/styles/overlay.css'
import '@/assets/styles/tailwind.css'
import NotificationDomain from '@/domain/Notification'
import { createElement } from '@/utils'
import { TranslatorImpl } from '@/domain/impls/Translator'

export default defineContentScript({
  cssInjectionMode: 'ui',
  runAt: 'document_idle',
  matches: ['https://*/*'],
  excludeMatches: ['*://localhost/*', '*://127.0.0.1/*', '*://*.csdn.net/*', '*://*.csdn.com/*'],
  async main(ctx) {
    window.CSS.registerProperty({
      name: '--shimmer-angle',
      syntax: '<angle>',
      inherits: false,
      initialValue: '0deg'
    })

    const store = Remesh.store({
      externs: [
        LocalStorageImpl,
        IndexDBStorageImpl,
        BrowserSyncStorageImpl,
        ChatRoomImpl,
        VirtualRoomImpl,
        ToastImpl,
        DanmakuImpl,
        NotificationImpl,
        TranslatorImpl
      ]
      // inspectors: __DEV__ ? [RemeshLogger()] : []
    })

    const ui = await createShadowRootUi(ctx, {
      name: __NAME__,
      position: 'inline',
      anchor: 'body',
      append: 'last',
      mode: 'open',
      isolateEvents: ['keyup', 'keydown', 'keypress'],
      onMount: (container) => {
        const app = createElement('<div id="root"></div>')
        container.append(app)
        const root = createRoot(app)
        root.render(
          <React.StrictMode>
            <RemeshRoot store={store}>
              <RemeshScope domains={[NotificationDomain()]}>
                <App />
              </RemeshScope>
            </RemeshRoot>
          </React.StrictMode>
        )
        return root
      },
      onRemove: (root) => {
        root?.unmount()
      }
    })
    ui.mount()
  }
})
