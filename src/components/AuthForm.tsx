import { Button } from '@/components/ui/button'
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
        <main className="min-h-screen bg-background px-6 py-10 text-foreground">
            <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-sm flex-col justify-center">
                <div className="space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-semibold tracking-normal text-foreground">
                            校园墙
                        </h1>
                    </div>

                    <div className="grid gap-3">
                        <Button type="button" size="lg" onClick={() => setMode('login')}>
                            已有账号，去登录
                        </Button>

                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            onClick={() => setMode('register')}
                        >
                            没有账号，去注册
                        </Button>
                    </div>
                </div>
            </section>
        </main>
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
        <main>
            <section className='mx-auto flex min-h-[calc(100vh-5rem)] max-w-sm flex-col justify-center'>
                <form className='space-y-5' onSubmit={handleSubmit}>
                    <div className='space-y-2 text-center'>
                        <p className="text-sm font-medium text-muted-foreground">Campus Wall</p>
                        <h1 className='text-3xl font-semibold tracking-normal text-foreground'>
                            {isRegister ? '注册' : '登录'}
                        </h1>
                    </div>

                    <label>
                        邮箱
                        <input 
                            className='h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/30'
                            type='email' 
                            value={email} 
                            onChange={(event) => setEmail(event.target.value)} 
                            required/>
                    </label>

                    {isRegister && (
                        <label>
                            邮箱验证码
                            <div className='emailcode'>
                                <input 
                                className='h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/30'
                                value={emailCode} 
                                onChange={(event) => setEmailCode(event.target.value)} 
                                required/>
                                <Button onClick={handleSendEmailCode} disabled={sendingCode}>
                                    {sendingCode ? '发送中...' : '发送验证码'}
                                </Button>
                            </div>
                        </label>
                    )}

                    {isRegister && (
                        <label>昵称
                            <input 
                                className='h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/30'
                                value={name} 
                                onChange={(event) => setName(event.target.value)} 
                                placeholder='输入昵称'
                            />
                        </label>
                    )}

                    <label>密码
                        <input 
                            className='h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/30'
                            type='password' 
                            value={password} 
                            onChange={(event) => setPassword(event.target.value)} 
                            minLength={6} 
                            required/>
                        </label>

                    {error && <p className='autherror'>{error}</p>}
                    {notice && <p className='authnotice'>{notice}</p>}

                    <Button type='submit' disabled={loading}>
                        {loading ? '处理中...' : isRegister ? '注册并登录' : '登录'}
                    </Button>

                    <Button variant='outline' onClick={() => {
                        setError('')
                        setMode('choice')
                    }}>
                        返回
                    </Button>
                </form>
            </section>
        </main>
    )
}