import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Loader2, 
  FileText, 
  Weight, 
  Pencil, 
  Scale, 
  Ruler, 
  Activity, 
  Apple, 
  Droplet, 
  Moon, 
  Dumbbell, 
  Sparkles,
  AlertCircle
} from 'lucide-react'

export default function PerfilPacienteView({ pacienteId, onBack, onEdit }) {
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (pacienteId) {
      fetchPerfilData()
    }
  }, [pacienteId])

  async function fetchPerfilData() {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados do paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single()

      if (pacienteError) throw pacienteError
      setPaciente(pacienteData)

      // Buscar histórico de consultas
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data_consulta', { ascending: false })

      if (consultasError) throw consultasError
      setConsultas(consultasData || [])

    } catch (err) {
      console.error('Erro ao buscar dados do perfil:', err)
      setError('Erro ao carregar o perfil do paciente.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={40} color="var(--accent)" />
        <p>Carregando perfil do paciente...</p>
      </div>
    )
  }

  if (error || !paciente) {
    return (
      <div className="error-container">
        <div className="error-alert">{error || 'Paciente não encontrado.'}</div>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    )
  }

  // Formatação de data simples
  const formatarData = (dataStr) => {
    if (!dataStr) return 'N/A'
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  // Helper para cálculo da Idade
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return ''
    const hoje = new Date()
    const nascimento = new Date(dataNasc + 'T00:00:00')
    let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idadeCalculada--
    }
    return idadeCalculada >= 0 ? ` (${idadeCalculada} anos)` : ''
  }

  // Helper para cálculo de IMC e classificação colorida
  const obterImcData = (peso, altura) => {
    if (!peso || !altura) return null
    let altM = altura
    // Ajuste inteligente: se tiver em cm (ex: 175), converte para metros (1.75)
    if (altM > 3.0) {
      altM = altM / 100
    }
    const imcValor = peso / (altM * altM)
    const imcFmt = imcValor.toFixed(2)
    
    let classe = ''
    let cor = ''
    let bgCor = ''
    if (imcValor < 18.5) {
      classe = 'Abaixo do peso'
      cor = '#2563eb'
      bgCor = '#dbeafe'
    } else if (imcValor < 25) {
      classe = 'Peso normal'
      cor = '#16a34a'
      bgCor = '#dcfce7'
    } else if (imcValor < 30) {
      classe = 'Sobrepeso'
      cor = '#d97706'
      bgCor = '#fef3c7'
    } else if (imcValor < 35) {
      classe = 'Obesidade Grau I'
      cor = '#ea580c'
      bgCor = '#ffedd5'
    } else if (imcValor < 40) {
      classe = 'Obesidade Grau II'
      cor = '#dc2626'
      bgCor = '#fee2e2'
    } else {
      classe = 'Obesidade Grau III'
      cor = '#991b1b'
      bgCor = '#fecaca'
    }
    return { imc: imcFmt, classe, cor, bgCor }
  }

  const imcCalculado = obterImcData(paciente.peso_inicial, paciente.altura)

  return (
    <div className="perfil-container">
      <header className="perfil-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <button className="btn-back" onClick={onBack} title="Voltar">
            <ArrowLeft size={20} />
            <span>Voltar para Pacientes</span>
          </button>
          <h1 className="perfil-title">Perfil do Paciente</h1>
        </div>
        
        {/* Botão de Editar Dados */}
        <button className="btn-primary" onClick={onEdit} style={{ gap: '0.6rem' }}>
          <Pencil size={18} />
          <span>Editar Dados</span>
        </button>
      </header>

      <div className="perfil-grid">
        {/* Card de Dados Pessoais */}
        <section className="perfil-card personal-info">
          <div className="avatar-large">
            {paciente.nome?.charAt(0).toUpperCase()}
          </div>
          <h2>{paciente.nome}</h2>
          
          <div className="info-list">
            <div className="info-item">
              <Mail size={18} />
              <div>
                <label>Email</label>
                <span>{paciente.email || 'Não informado'}</span>
              </div>
            </div>
            <div className="info-item">
              <Phone size={18} />
              <div>
                <label>WhatsApp</label>
                <span>{paciente.whatsapp || 'Não informado'}</span>
              </div>
            </div>
            <div className="info-item">
              <Calendar size={18} />
              <div>
                <label>Data de Nascimento</label>
                <span>{formatarData(paciente.data_nascimento)}{calcularIdade(paciente.data_nascimento)}</span>
              </div>
            </div>
            <div className="info-item">
              <User size={18} />
              <div>
                <label>Sexo</label>
                <span>{paciente.sexo || 'Não informado'}</span>
              </div>
            </div>
          </div>
          
          {/* Objetivos Alimentares em Chips */}
          {paciente.objetivos && paciente.objetivos.length > 0 && (
            <div className="objetivo-seccao" style={{ marginBottom: '1rem', width: '100%' }}>
              <h3>Objetivos Alimentares</h3>
              <div className="chip-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                {paciente.objetivos.map((obj, idx) => (
                  <span key={idx} className="chip chip-objetivo" style={{
                    background: 'rgba(212, 180, 131, 0.15)',
                    color: '#8b6e37',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '50px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    border: '1px solid rgba(212, 180, 131, 0.3)'
                  }}>{obj}</span>
                ))}
              </div>
            </div>
          )}

          {paciente.objetivo_texto && (
            <div className="objetivo-seccao" style={{ width: '100%' }}>
              <h3>Detalhamento do Objetivo</h3>
              <p style={{ margin: '0.5rem 0 0 0' }}>{paciente.objetivo_texto}</p>
            </div>
          )}
        </section>

        {/* Coluna Direita: Ficha Clínica, Hábitos e Histórico de Consultas */}
        <div className="perfil-main-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Ficha Clínica & Hábitos de Vida */}
          <section className="perfil-card clinico-habitos-card" style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.75rem', color: 'var(--text-h)' }}>
              <Activity size={22} style={{ color: 'var(--accent)' }} />
              Ficha Clínica & Hábitos de Vida
            </h2>

            <div className="clinico-habitos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Seção Clínica */}
              <div className="clinico-seccao" style={{ display: 'flex', flexType: 'column', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent)' }}>Dados Físicos & Clínicos</h3>
                
                {/* Indicadores Físicos */}
                <div className="indicadores-fisicos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                  <div className="indicador-fisico-card" style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Scale size={20} style={{ color: 'var(--accent)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.7, fontWeight: '600' }}>Peso Atual</label>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-h)' }}>{paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="indicador-fisico-card" style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Ruler size={20} style={{ color: 'var(--accent)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.7, fontWeight: '600' }}>Altura</label>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-h)' }}>{paciente.altura ? `${paciente.altura} cm` : 'N/A'}</span>
                    </div>
                  </div>

                  {imcCalculado && (
                    <div className="indicador-fisico-card" style={{ background: imcCalculado.bgCor, padding: '1rem', borderRadius: '14px', border: `1px solid ${imcCalculado.cor}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Activity size={20} style={{ color: imcCalculado.cor }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-h)', opacity: 0.8, fontWeight: '700' }}>IMC: {imcCalculado.imc}</label>
                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: imcCalculado.cor }}>{imcCalculado.classe}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dados Clínicos Detalhados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)' }}>Nível de Atividade:</span>
                    <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>{paciente.nivel_atividade || 'Não informado'}</span>
                  </div>

                  {paciente.medicamentos && (
                    <div style={{ background: 'var(--bg)', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.3rem' }}>Medicamentos de Uso Contínuo:</span>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.4 }}>{paciente.medicamentos}</p>
                    </div>
                  )}

                  {paciente.suplementos && (
                    <div style={{ background: 'var(--bg)', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.3rem' }}>Suplementação em Uso:</span>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.4 }}>{paciente.suplementos}</p>
                    </div>
                  )}
                </div>

                {/* Patologias, Alergias e Restrições em Chips Premium */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  
                  {/* Patologias */}
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.5rem' }}>Condições de Saúde / Patologias:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {paciente.patologias && paciente.patologias.length > 0 && !paciente.patologias.includes('Nenhum') ? (
                        paciente.patologias.map((pat, idx) => (
                          <span key={idx} style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #fecaca' }}>{pat}</span>
                        ))
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Nenhuma patologia cadastrada</span>
                      )}
                    </div>
                  </div>

                  {/* Restrições Alimentares */}
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.5rem' }}>Restrições Alimentares:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 && !paciente.restricoes_alimentares.includes('Nenhum') ? (
                        paciente.restricoes_alimentares.map((rest, idx) => (
                          <span key={idx} style={{ background: '#ffedd5', color: '#c2410c', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #fed7aa' }}>{rest}</span>
                        ))
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Nenhuma restrição alimentar</span>
                      )}
                    </div>
                  </div>

                  {/* Alergias Alimentares */}
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.5rem' }}>Alergias Alimentares:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {paciente.alergias && paciente.alergias.length > 0 && !paciente.alergias.includes('Nenhum') ? (
                        paciente.alergias.map((alerg, idx) => (
                          <span key={idx} style={{ background: '#fef3c7', color: '#b45309', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #fde68a' }}>{alerg}</span>
                        ))
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Nenhuma alergia cadastrada</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Seção Hábitos de Vida */}
              <div className="habitos-seccao" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent)' }}>Hábitos de Vida & Rotina</h3>

                <div className="habitos-cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: '700', fontSize: '0.85rem' }}>
                      <Apple size={16} />
                      <span>Alimentação</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }}>
                      <strong>{paciente.refeicoes_por_dia || 'N/A'}</strong> refeições por dia
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: '700', fontSize: '0.85rem' }}>
                      <Droplet size={16} />
                      <span>Hidratação</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }}>
                      <strong>{paciente.litros_agua ? `${paciente.litros_agua} Litros` : 'N/A'}</strong> de água/dia
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: '700', fontSize: '0.85rem' }}>
                      <Moon size={16} />
                      <span>Sono</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.4 }}>
                      Acorda: <strong>{paciente.horario_acorda || 'N/A'}</strong><br />
                      Dorme: <strong>{paciente.horario_dorme || 'N/A'}</strong>
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontWeight: '700', fontSize: '0.85rem' }}>
                      <Dumbbell size={16} />
                      <span>Atividade Física</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.3 }}>
                      {paciente.atividade_fisica ? (
                        <>
                          <strong style={{ color: 'var(--accent)' }}>Sim</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={paciente.atividade_fisica_descricao}>{paciente.atividade_fisica_descricao}</span>
                        </>
                      ) : (
                        <strong style={{ color: '#ef4444' }}>Não pratica</strong>
                      )}
                    </p>
                  </div>

                </div>

                {/* Observações Gerais / Anotações */}
                {paciente.observacoes && (
                  <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)' }}>
                      <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                      <span>Considerações Clínicas / Hábitos</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
                      {paciente.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Card do Histórico de Consultas */}
          <section className="perfil-card consult-history">
            <div className="section-header">
              <h2>Histórico de Consultas</h2>
            </div>

            {consultas.length > 0 ? (
              <div className="consult-list">
                {consultas.map((c) => (
                  <div key={c.id} className="consult-item">
                    <div className="consult-date-badge">
                      <Calendar size={16} />
                      <span>{formatarData(c.data_consulta)}</span>
                    </div>
                    
                    <div className="consult-metrics">
                      {c.peso && (
                        <div className="metric">
                          <Weight size={14} />
                          <span><strong>Peso:</strong> {c.peso} kg</span>
                        </div>
                      )}
                      {c.percentual_gordura && (
                        <div className="metric">
                          <FileText size={14} />
                          <span><strong>Gordura:</strong> {c.percentual_gordura}%</span>
                        </div>
                      )}
                    </div>

                    {c.observacoes && (
                      <div className="consult-notes">
                        <strong>Observações:</strong>
                        <p>{c.observacoes}</p>
                      </div>
                    )}

                    {c.proximo_retorno && (
                      <div className="next-return">
                        <span><strong>Próximo Retorno:</strong> {formatarData(c.proximo_retorno)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-history">
                <FileText size={40} />
                <p>Nenhuma consulta registrada para este paciente.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

