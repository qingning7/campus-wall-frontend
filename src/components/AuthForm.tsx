import { useState } from 'react'
import { login, register, sendEmailCode, type AuthUser } from '../api/auth'

type AuthMode = 'choice' | 'login' | 'register'

type AuthFormProps = {
    onAuthed: (user: AuthUser) => void
}

export function AuthForm({ onAuthed }: AuthFormProps) {
    const [mode, setMode] = useState<AuthMode>('choice')
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [emailCode, setEmailCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [notice, setNotice] = useState('')
    const [sendingCode, setSendingCode] = useState(false)

    const isRegister = mode === 'register'

    if (mode === 'choice') {
        return (
            <section className='auth'>
                <div className='authform'>
                    <button type='button' onClick={() => setMode('login')}>已有账号，去登陆</button>
                    <button type='button' onClick={() => setMode('register')}>没有账号，去注册</button>
                </div>
            </section>
        )
    }

    async function handleSendEmailCode() {
        setError('')
        setNotice('')

        if (!email.trim()) {
            setError('请输入邮箱')
            return
        }

        setSendingCode(true)

        try {
            const result = await sendEmailCode(email)

            setNotice(`验证码已发送，验证码为：${result.devCode}`) // 开发模式
        } catch (error) {
            setError(error instanceof Error ? error.message : '发送验证码失败')
        } finally {
            setSendingCode(false)
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError('')
        setLoading(true)

        try {
            if (isRegister) {
                await register({
                    email,
                    password,
                    name: name.trim() || undefined,
                    emailCode
                })
            }

            const result = await login({
                email,
                password
            })

            onAuthed(result.user)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Request failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className='auth'>
            <form className='authfrom' onSubmit={handleSubmit}>
                <h1>{isRegister ? '注册' : '登录'}</h1>

                <label>邮箱<input type='email' value={email} onChange={(event) => setEmail(event.target.value)} required/></label>

                {isRegister && (
                    <label>
                        邮箱验证码
                        <div className='emailcode'>
                            <input value={emailCode} onChange={(event) => setEmailCode(event.target.value)} required/>
                            <button type='button' onClick={handleSendEmailCode} disabled={sendingCode}>
                                {sendingCode ? '发送中...' : '发送验证码'}
                            </button>
                        </div>
                    </label>
                )}

                {isRegister && (
                    <label>昵称<input value={name} onChange={(event) => setName(event.target.value)} placeholder='输入昵称'/></label>
                )}

                <label>密码<input type='password' value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required/></label>

                {error && <p className='autherror'>{error}</p>}
                {notice && <p className='authnotice'>{notice}</p>}

                <button type='submit' disabled={loading}>
                    {loading ? '处理中...' : isRegister ? '注册并登录' : '登录'}
                </button>

                <button type='button' className='authswitch' onClick={() => {
                    setError('')
                    setMode('choice')
                }}>
                    返回
                </button>
            </form>
        </section>
    )
}