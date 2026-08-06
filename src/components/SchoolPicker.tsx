import { useEffect, useMemo, useState } from 'react'
import { bindMySchool, type AuthUser } from '../api/auth'
import { getSchools, type School } from '../api/school'

type SchoolPickerProps = {
  user: AuthUser
  onSelected: (user: AuthUser) => void
}

export function SchoolPicker({ user, onSelected }: SchoolPickerProps) {
    const [schools, setSchools] = useState<School[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [savingSchoolId, setSavingSchoolId] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadSchools() {
            try {
                const data = await getSchools()
                setSchools(data)
            } catch (error) {
                setError(error instanceof Error ? error.message : '加载学校列表失败')
            } finally {
                setLoading(false)
            }
        }

        loadSchools()
    }, [])

    const filteredSchools = useMemo(() => {
        const keyword = search.trim().toLowerCase()
        if (!keyword) return schools
        return schools.filter((school) => school.name.toLowerCase().includes(keyword))
    }, [schools, search])

    async function handleSelectSchool(schoolId: string) {
        setError('')
        setSavingSchoolId(schoolId)

        try {
            const updatedUser = await bindMySchool(schoolId)
            onSelected(updatedUser)
        } catch (error) {
            setError(error instanceof Error ? error.message : '绑定学校失败')
        } finally {
            setSavingSchoolId('')
        }
    }

    return (
        <main className='app-shell'>
            <h1>选择学校</h1>
            <p>{user.name || user.email}</p>
            <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索学校"
            />

            {error && <p className='auth-error'>{error}</p>}

            {loading ? (
                <p>加载中...</p>
            ) : filteredSchools.length ? (
                <ul>
                    {filteredSchools.map((school) => (
                        <li key={school.id}>
                            <button
                                disabled={savingSchoolId === school.id}
                                onClick={() => handleSelectSchool(school.id)}
                            >
                                {savingSchoolId === school.id ? '绑定中...' : school.name}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>未找到匹配的学校</p>
            )}
        </main>
    )
}