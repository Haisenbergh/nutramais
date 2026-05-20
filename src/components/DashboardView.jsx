import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Users, Calendar, AlertTriangle, ChevronRight, Loader2, User } from 'lucide-react'

export default function DashboardView({ session, onSelectPatient }) {
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [consultasSemana, setConsultasSemana] = useState(0)
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nomeNutri, setNomeNutri] = useState('')

  // Estados para Edição de Dados Cadastrais da Nutricionista
  const [modalAberto, setModalAberto] = useState(false)
  const [nomeEdit, setNomeEdit] = useState('')
  const [emailEdit, setEmailEdit] = useState('')
  const [salvandoNutri, setSalvandoNutri] = useState(false)
  const [sucessoNutri, setSucessoNutri] = useState('')
  const [erroNutri, setErroNutri] = useState('')


  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData()
    }
  }, [session])

  async function buscarDadosNutri() {
    try {
      const { data, error } = await supabase
        .from('nutricionistas')
        .select('nome, email')
        .eq('id', session.user.id)
        .single()

      if (!error && data) {
        setNomeEdit(data.nome || '')
        // O e-mail da sessão ativa do Supabase Auth é a fonte da verdade para o login real
        setEmailEdit(session?.user?.email || data.email || '')
      } else {
        setEmailEdit(session?.user?.email || '')
      }
    } catch (err) {
      console.error('Erro ao buscar dados cadastrais da nutricionista:', err)
      setEmailEdit(session?.user?.email || '')
    }
  }

  async function handleSalvarNutri(e) {
    e.preventDefault()
    if (!nomeEdit.trim()) {
      setErroNutri('O nome é obrigatório.')
      return
    }

    try {
      setSalvandoNutri(true)
      setErroNutri('')
      setSucessoNutri('')

      // 1. Atualizar a tabela nutricionistas no Supabase (apenas o nome, por segurança)
      const { error: updateError } = await supabase
        .from('nutricionistas')
        .update({ nome: nomeEdit.trim() })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      // 2. Atualizar o user_metadata no auth do Supabase
      await supabase.auth.updateUser({
        data: { full_name: nomeEdit.trim() }
      })

      setSucessoNutri('Dados cadastrais atualizados com sucesso!')
      
      // Atualizar o nome na tela principal
      const primeiroNome = nomeEdit.trim().split(' ')[0]
      const nomeFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
      setNomeNutri(nomeFormatado)

      setTimeout(() => {
        setModalAberto(false)
        setSucessoNutri('')
      }, 1500)

    } catch (err) {
      console.error('Erro ao salvar dados cadastrais da nutricionista:', err)
      setErroNutri(err.message || 'Erro ao atualizar dados. Tente novamente.')
    } finally {
      setSalvandoNutri(false)
    }
  }

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)
      const nutricionistaId = session.user.id

      // Buscar perfil da nutricionista para exibir o primeiro nome personalizado
      try {
        const { data: nutriData, error: nutriError } = await supabase
          .from('nutricionistas')
          .select('nome')
          .eq('id', nutricionistaId)
          .single()

        if (!nutriError && nutriData?.nome) {
          const primeiroNome = nutriData.nome.trim().split(' ')[0]
          const nomeFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
          setNomeNutri(nomeFormatado)
        } else {
          // Fallback para user_metadata caso não encontre na tabela
          const fullMetadataName = session.user?.user_metadata?.full_name || session.user?.user_metadata?.nome
          if (fullMetadataName) {
            const primeiroNome = fullMetadataName.trim().split(' ')[0]
            const nomeFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
            setNomeNutri(nomeFormatado)
          }
        }
      } catch (profileErr) {
        console.warn('Erro ao carregar nome do perfil:', profileErr)
      }

      // 1. Total de pacientes ativos (cadastrados pela nutricionista)
      const { count: pacientesCount, error: countError } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('nutricionista_id', nutricionistaId)

      if (countError) throw countError
      setTotalPacientes(pacientesCount || 0)

      // 2. Consultas da semana
      const { start: startOfWeek, end: endOfWeek } = getWeekRange()
      
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('id, data_consulta, pacientes!inner(nutricionista_id)')
        .eq('pacientes.nutricionista_id', nutricionistaId)
        .gte('data_consulta', startOfWeek)
        .lte('data_consulta', endOfWeek)

      if (consultasError) throw consultasError
      setConsultasSemana(consultasData?.length || 0)

      // 3. Pacientes sem retorno
      // Buscamos pacientes e todas as suas consultas para fazer a filtragem no frontend de forma robusta e precisa
      const { data: pacientesComConsultas, error: pacientesError } = await supabase
        .from('pacientes')
        .select(`
          id,
          nome,
          consultas (
            data_consulta,
            proximo_retorno
          )
        `)
        .eq('nutricionista_id', nutricionistaId)

      if (pacientesError) throw pacientesError

      const hojeStr = formatarDataHoje() // YYYY-MM-DD
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const semRetorno = []

      if (pacientesComConsultas) {
        pacientesComConsultas.forEach(paciente => {
          const consultas = paciente.consultas || []
          if (consultas.length === 0) return // Sem consultas não se aplica à regra "última consulta foi há mais de 30 dias"

          // Ordenar as consultas por data decrescente
          const consultasOrdenadas = [...consultas].sort((a, b) => 
            new Date(b.data_consulta) - new Date(a.data_consulta)
          )

          const ultimaConsulta = consultasOrdenadas[0]
          const dataUltima = new Date(ultimaConsulta.data_consulta + 'T00:00:00')
          
          // Diferença em dias
          const diffTime = Math.abs(hoje - dataUltima)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays > 30) {
            // Verificar se possui QUALQUER próximo retorno futuro agendado em todas as suas consultas
            const temRetornoFuturo = consultas.some(c => {
              if (!c.proximo_retorno) return false
              const retornoDate = new Date(c.proximo_retorno + 'T00:00:00')
              return retornoDate >= hoje
            })

            if (!temRetornoFuturo) {
              semRetorno.push({
                id: paciente.id,
                nome: paciente.nome,
                diasSemConsulta: diffDays,
                dataUltimaConsulta: ultimaConsulta.data_consulta
              })
            }
          }
        })
      }

      setPacientesSemRetorno(semRetorno)

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError('Ocorreu um erro ao carregar os dados do painel.')
    } finally {
      setLoading(false)
    }
  }

  // Helper para obter a data de hoje no fuso local como YYYY-MM-DD
  function formatarDataHoje() {
    const d = new Date()
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  // Obter intervalo de Segunda a Domingo da semana atual
  function getWeekRange() {
    const today = new Date()
    const day = today.getDay() // 0: Domingo, 1: Segunda...
    
    // Ajustar para que a semana comece na segunda-feira (1)
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1)
    
    const monday = new Date(today)
    monday.setDate(diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const formatDate = (d) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const date = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${date}`
    }

    return {
      start: formatDate(monday),
      end: formatDate(sunday)
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={40} color="var(--accent)" />
        <p>Carregando informações em tempo real...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-view">
      <header className="dashboard-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-h)', letterSpacing: '-0.025em' }}>
            {nomeNutri ? `Bem-vindo(a), ${nomeNutri}!` : 'Bem-vindo(a)!'}
          </h1>
          <p className="welcome-text" style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>
            Aqui está um resumo da sua clínica.
          </p>
        </div>

        {/* Botão de Editar Dados da Nutricionista */}
        <button 
          onClick={() => {
            buscarDadosNutri()
            setModalAberto(true)
          }}
          className="btn-secondary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            padding: '0.8rem 1.4rem', 
            borderRadius: '14px',
            cursor: 'pointer',
            fontWeight: '700',
            background: 'white',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            color: 'var(--text-h)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-h)'
          }}
        >
          <User size={18} />
          <span>Editar Meus Dados</span>
        </button>
      </header>

      {error && <div className="error-alert">{error}</div>}

      <div className="dashboard-cards-grid">
        {/* Card 1: Total Pacientes */}
        <div className="dashboard-card card-pacientes">
          <div className="card-header">
            <span className="card-title">Pacientes Ativos</span>
            <div className="card-icon-wrapper">
              <Users size={22} />
            </div>
          </div>
          <div className="card-body">
            <span className="card-number">{totalPacientes}</span>
            <span className="card-subtitle">pacientes cadastrados</span>
          </div>
        </div>

        {/* Card 2: Consultas da Semana */}
        <div className="dashboard-card card-consultas">
          <div className="card-header">
            <span className="card-title">Consultas da Semana</span>
            <div className="card-icon-wrapper">
              <Calendar size={22} />
            </div>
          </div>
          <div className="card-body">
            <span className="card-number">{consultasSemana}</span>
            <span className="card-subtitle">registros esta semana</span>
          </div>
        </div>

        {/* Card 3: Pacientes Sem Retorno */}
        <div className="dashboard-card card-alertas span-two">
          <div className="card-header">
            <div className="title-with-badge">
              <span className="card-title">Pacientes Sem Retorno</span>
              {pacientesSemRetorno.length > 0 && (
                <span className="badge-alert">{pacientesSemRetorno.length}</span>
              )}
            </div>
            <div className="card-icon-wrapper alert-icon">
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="card-body scrollable-card-body">
            {pacientesSemRetorno.length > 0 ? (
              <ul className="alert-patient-list">
                {pacientesSemRetorno.map((p) => (
                  <li key={p.id} className="alert-patient-item" onClick={() => onSelectPatient(p.id)}>
                    <div className="patient-item-left">
                      <div className="avatar-small">{p.nome.charAt(0).toUpperCase()}</div>
                      <div className="patient-item-details">
                        <span className="patient-name">{p.nome}</span>
                        <span className="patient-sub-details">
                          Última consulta em {formatarData(p.dataUltimaConsulta)} ({p.diasSemConsulta} dias atrás)
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="arrow-icon" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-alert-state">
                <p className="no-return-msg">Nenhum paciente sem retorno no momento</p>
                <p className="sub-msg">Todos os seus pacientes estão com o acompanhamento em dia!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Moderno de Edição de Dados Cadastrais da Nutricionista */}
      {modalAberto && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="modal-card" style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            textAlign: 'left'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-h)' }}>
              Meus Dados Cadastrais
            </h2>

            {erroNutri && (
              <div className="error-alert" style={{ marginBottom: '1.5rem' }}>
                {erroNutri}
              </div>
            )}

            {sucessoNutri && (
              <div className="sucesso-alert" style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                fontWeight: '600',
                marginBottom: '1.5rem'
              }}>
                {sucessoNutri}
              </div>
            )}

            <form onSubmit={handleSalvarNutri}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: 'var(--text-h)', fontSize: '0.9rem' }}>
                  Nome Completo
                </label>
                <input 
                  type="text" 
                  required
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(e.target.value)}
                  placeholder="Seu nome completo"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-h)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: 'var(--text-h)', fontSize: '0.9rem' }}>
                  E-mail de Cadastro
                </label>
                <input 
                  type="email" 
                  disabled
                  value={emailEdit}
                  placeholder="seuemail@exemplo.com"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed'
                  }}
                />
                <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                  💡 Para sua segurança, o e-mail de login é vinculado de forma segura à sua conta do Supabase e não pode ser alterado diretamente por aqui.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setModalAberto(false)}
                  disabled={salvandoNutri}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    color: 'var(--text-h)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={salvandoNutri}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {salvandoNutri ? 'Salvando...' : 'Salvar Dados'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
