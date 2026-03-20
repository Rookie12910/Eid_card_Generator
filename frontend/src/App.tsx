import { useState } from 'react'
import LandingPage from './components/LandingPage'
import CardEditor from './components/CardEditor'
import './index.css'

function App() {
  const [showEditor, setShowEditor] = useState(false)

  return (
    <>
      {showEditor ? (
        <CardEditor onBack={() => setShowEditor(false)} />
      ) : (
        <LandingPage onStart={() => setShowEditor(true)} />
      )}
    </>
  )
}

export default App
