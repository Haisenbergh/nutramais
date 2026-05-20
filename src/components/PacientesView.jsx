import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Users, Plus, Search, Trash2, Loader2, ChevronRight, Calendar, Target } from 'lucide-react'

export default function PacientesView({ session, onSelectPatient, onNovoPaciente }) {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPacientes()
  }, [])

  async function fetchPacientes() {
    try {
      setLoading(true)
      setError(null)
      // Buscamos os pacientes e as datas das suas consultas para descobrir a última consulta
      const { data, error } = await supabase
        .from('pacientes')
        .select(`
          id,
          nome,
          objetivos,
          objetivo_texto,
          consultas (
            data_consulta
          )
        `)
        .eq('nutricionista_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPacientes(data || [])
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
      setError('Não foi possível carregar os pacientes.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation() // impede de abrir o perfil ao clicar no botão de excluir
    if (!confirm('Deseja excluir este paciente e todas as suas consultas associadas?')) return
    try {
      // O Supabase tem ON DELETE CASCADE nas chaves estrangeiras de consultas e planos. 
      // Se não tiver, precisamos deletar antes. Mas deletar da tabela pacientes:
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setPacientes(pacientes.filter(p => p.id !== id))
    } catch (err) {
      console.error('Erro ao deletar:', err)
      setError('Erro ao excluir paciente.')
    }
  }

  // Formatar data da última consulta de forma decrescente
  const obterUltimaConsulta = (consultas) => {
    if (!consultas || consultas.length === 0) return 'Nenhuma consulta registrada'
    const ordenadas = [...consultas].sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta))
    const [ano, mes, dia] = ordenadas[0].data_consulta.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const obterObjetivoExibicao = (p) => {
    if (p.objetivos && p.objetivos.length > 0) {
      return p.objetivos.join(', ')
    }
    return p.objetivo_texto || 'Não informado'
  }

  const filteredPacientes = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="pacientes-view-container">
      <header className="dash-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Meus Pacientes</h1>
            <p className="welcome-text">Visualize, busque e gerencie o histórico clínico e hábitos de seus pacientes.</p>
          </div>
          <button className="btn-primary" onClick={onNovoPaciente}>
            <Plus size={20} />
            Novo Paciente
          </button>
        </div>
        
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar paciente por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="dash-main">
        {error && <div className="error-alert">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={40} color="var(--accent)" />
            <p>Carregando lista de pacientes...</p>
          </div>
        ) : (
          <div className="patient-grid">
            {filteredPacientes.length > 0 ? (
              filteredPacientes.map((p) => {
                const ultimaConsulta = obterUltimaConsulta(p.consultas)
                return (
                  <div key={p.id} className="patient-card interactive-card" onClick={() => onSelectPatient(p.id)}>
                    <div className="patient-info">
                      <div className="patient-avatar">
                        {p.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3>{p.nome}</h3>
                        <div className="patient-details">
                          <span className="detail-item objetivos-list" style={{ color: 'var(--text-h)', opacity: 0.85 }}>
                            <Target size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} /> 
                            <strong style={{ marginRight: '0.25rem' }}>Objetivo:</strong> 
                            <span style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{obterObjetivoExibicao(p)}</span>
                          </span>
                          <span className="detail-item data-consulta" style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                            <Calendar size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> 
                            <strong>Última consulta:</strong> {ultimaConsulta}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="card-right-actions">
                      <button className="btn-icon-delete" onClick={(e) => handleDelete(e, p.id)} title="Excluir paciente">
                        <Trash2 size={18} />
                      </button>
                      <ChevronRight size={18} className="arrow-details" />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white', border: '1px dashed var(--border)', borderRadius: '20px', padding: '4rem' }}>
                <Users size={48} style={{ color: 'var(--accent)', opacity: 0.5, marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-h)', margin: 0 }}>Nenhum paciente cadastrado ainda</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text)', marginTop: '0.25rem' }}>Cadastre um novo paciente para iniciar os acompanhamentos.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
