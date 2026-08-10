'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email o contraseña incorrectos')
      return
    }

    router.push('/app1')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0f14]">
      <form
        onSubmit={handleLogin}
        className="bg-[#12171f] p-8 rounded-lg shadow-2xl w-96 border border-brand-orange/20"
      >
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo-icon.jpg" alt="Eagles Gear Solutions" width={72} height={72} className="rounded-full mb-3" />
          <h2 className="text-2xl font-bold text-white">
            Eagles <span className="text-brand-orange">Gear</span>
          </h2>
          <p className="text-sm text-brand-blue tracking-widest">CRM</p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-[#0b0f14] border border-white/10 text-white placeholder:text-gray-500 focus:border-brand-blue outline-none"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-[#0b0f14] border border-white/10 text-white placeholder:text-gray-500 focus:border-brand-blue outline-none"
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-brand-orange text-white p-2 rounded font-bold hover:bg-brand-orange-dark transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}