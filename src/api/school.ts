import { apiRequest } from '../lib/api'

export type School = {
  id: string
  name: string
  createdAt: string
}

export async function getSchools() {
  return apiRequest<School[]>('/api/schools')
}