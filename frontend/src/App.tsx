import { useState } from 'react'
import LandingPage from './components/LandingPage'
import CardEditor from './components/CardEditor'
import './index.css'
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [showEditor, setShowEditor] = useState(false)

  return (
    <>
      {showEditor ? (
        <CardEditor onBack={() => setShowEditor(false)} />
      ) : (
        <LandingPage onStart={() => setShowEditor(true)} />
      )}
      <Analytics />
    </>
  )
}

export default App
