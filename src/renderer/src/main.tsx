import './assets/base.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { assertPreloadBridge } from './bootstrap/assertPreloadBridge'

const container = document.getElementById('root')!

assertPreloadBridge(container)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
