import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ErrorBoundary from './components/ErrorBoundary'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || 'placeholder-client-id'

if (!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set in .env file. Google Calendar sync will be disabled.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
