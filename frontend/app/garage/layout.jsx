"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { GarageSidebar } from "@/components/dashboard/garage-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function GarageLayout({ children }) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
      } else if (userData && userData.role !== "garage") {
        // Redirect to appropriate dashboard based on role
        switch (userData.role) {
          case "client":
            router.push("/client/dashboard")
            break
          case "admin":
            router.push("/admin/dashboard")
            break
          default:
            router.push("/auth/login")
        }
      }
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || (userData && userData.role !== "garage")) {
    return null
  }

  return (
    <SidebarProvider>
      <GarageSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <span className="text-sm text-muted-foreground">Logged in as: {userData?.name}</span>
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}