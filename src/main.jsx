import React from 'react'
import ReactDOM from 'react-dom/client'

// Offline fonts — loaded from node_modules, no internet needed
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import App from '../JobHuntCommandCenter.jsx'

// localStorage polyfill for window.storage — matches the artifact API exactly
window.storage = {
  get: async (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      throw new Error(`Storage write failed: ${e.message}`)
    }
  },
  delete: async (key) => {
    localStorage.removeItem(key)
  },
  list: async (prefix) => {
    return Object.keys(localStorage).filter(k => k.startsWith(prefix))
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
