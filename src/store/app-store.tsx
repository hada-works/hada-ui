import React, { createContext, useContext, useState, ReactNode } from "react"
import { Tenant, User } from "@/types"
import { TENANTS, CURRENT_USER } from "./mock-data"

interface AppState {
  currentTenant: Tenant
  currentUser: User
  setCurrentTenant: (tenant: Tenant) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(TENANTS[0])

  return (
    <AppContext.Provider value={{
      currentTenant,
      currentUser: CURRENT_USER,
      setCurrentTenant,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
