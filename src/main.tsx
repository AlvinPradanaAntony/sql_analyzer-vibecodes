import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Inspector } from 'react-dev-inspector'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Inspector keys={['alt', 'c']}>
      <App />
    </Inspector>
  </StrictMode>,
)
