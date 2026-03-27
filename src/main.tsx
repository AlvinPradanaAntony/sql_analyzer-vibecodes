import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Inspector } from 'react-dev-inspector'
import './index.css'
import App from './App.tsx'

const RootApp = import.meta.env.DEV ? (
  <Inspector keys={['alt', 'c']}>
    <App />
  </Inspector>
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {RootApp}
  </StrictMode>,
)
