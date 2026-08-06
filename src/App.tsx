import { useState, useEffect } from 'react'
import { AuthForm } from './components/AuthForm'
import { getMe, logout, type AuthUser } from './api/auth'
import { SchoolPicker } from './components/SchoolPicker'

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const user = await getMe()
        setCurrentUser(user)
      } catch {
        logout()
      } finally {
        setCheckingSession(false)
      }
    }
    init()
  }, [])

  if (checkingSession) {
    return (
      <main className='app-shell'>
        <p>加载中...</p>
      </main>
    )
  }

  if (!currentUser) {
    return <AuthForm onAuthed={(user) => setCurrentUser(user)} />
  }

  if (!currentUser.schoolId) {
    return <SchoolPicker
      user={currentUser}
      onSelected={(user) => setCurrentUser(user)}
    />
  }
  
  return (
    <main className='app-shell'>
      <h1>欢迎，{currentUser.name || currentUser.email}</h1>
      {!currentUser.schoolId && (
        <SchoolPicker
          user={currentUser}
          onSelected={(user) => setCurrentUser(user)}
        />
      )}
      <button type='button' onClick={() => {logout(); setCurrentUser(null);}}>
        退出登录
      </button>
    </main>
  )
}

export default App
