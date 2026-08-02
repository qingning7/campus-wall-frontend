import { apiRequest, clearAuthToken, saveAuthToken } from '../lib/api'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  schoolId: string | null
  createdAt: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  name?: string
  schoolId?: string
  emailCode: string
}

export type SendEmailCodeResult = {
    message: string
    devCode: string
}

export type LoginResult = {
  token: string
  user: AuthUser
}

export async function login(input: LoginInput) {
    const result = await apiRequest<LoginResult>('/api/auth/login', {
        method: "POST",
        body: input
    })

    saveAuthToken(result.token)

    return result
}

export async function register(input: RegisterInput) {
  return apiRequest<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: input,
  })
}

export async function sendEmailCode(email: string) {
    return apiRequest<SendEmailCodeResult>('/api/auth/email-code', {
        method: 'POST',
        body: {
            email
        }
    })
}

export async function getMe() {
  return apiRequest<AuthUser>('/api/auth/me', {
    auth: true,
  })
}

export async function bindMySchool(schoolId: string) {
    return apiRequest<AuthUser>('/api/auth/me/school', {
        method: 'PATCH',
        auth: true,
        body: {
            schoolId
        }
    })
}

export function logout() {
  clearAuthToken()
}