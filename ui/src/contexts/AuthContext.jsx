import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await authAPI.login(email, password)
    const { token, user } = response

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)

    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const hasRole = (...roles) => {
    return user && roles.includes(user.role)
  }

  const isAdmin = () => hasRole('admin')
  const isDeliveryLead = () => hasRole('admin', 'delivery_lead')
  const isEngineeringManager = () => hasRole('admin', 'engineering_manager')
  const canApprove = () => hasRole('admin', 'delivery_lead', 'engineering_manager')
  const canEdit = () => hasRole('admin', 'user', 'delivery_lead', 'product_owner', 'engineering_manager')

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasRole,
      isAdmin,
      isDeliveryLead,
      isEngineeringManager,
      canApprove,
      canEdit,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
