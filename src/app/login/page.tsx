"use client"

import { Layout } from "@/components/layout/layout"
import { LoginForm } from "@/components/forms/login-form"

export default function Login() {
  const handleLogin = (data: { email: string; password: string }) => {
    console.log("Login data:", data)
    // Handle login logic here
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoginForm onSubmit={handleLogin} />
        </div>
      </div>
    </Layout>
  )
}
