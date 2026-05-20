import { useState } from 'react'
import { supabase } from './supabase'
import './Auth.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form states
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        // Cadastro
        if (password.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.')
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.')
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          // Salvar na tabela nutricionistas
          const { error: profileError } = await supabase
            .from('nutricionistas')
            .insert([{ id: data.user.id, nome, email }])

          if (profileError) {
            console.error('Erro ao salvar perfil:', profileError)
            // Mesmo com erro no perfil, a conta auth foi criada
          }
        }
      }
    } catch (err) {
      console.error('Erro na autenticação:', err)
      setError(err.message || 'Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <div className="logo-text">Nutri<span>A+</span></div>
        </div>

        <h2>{isLogin ? 'Bem-vinda de volta' : 'Crie sua conta'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleAuth}>
          {!isLogin && (
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="exemplo@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirmar Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <p>
              Não tem conta?{' '}
              <button onClick={() => setIsLogin(false)}>Cadastre-se</button>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <button onClick={() => setIsLogin(true)}>Faça login</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
