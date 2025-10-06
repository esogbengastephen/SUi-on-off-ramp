"use client"

import { Layout } from "@/components/layout/layout"
import { RegisterForm } from "@/components/forms/register-form"

export default function Register() {
  const handleRegister = (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    console.log("Register data:", data)
    // Handle registration logic here
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <RegisterForm onSubmit={handleRegister} />
        </div>
      </div>
    </Layout>
  )
}
