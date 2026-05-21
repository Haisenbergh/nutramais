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
  AlertCircle,
  Save,
  Plus,
  TrendingUp,
  X,
  ChevronRight,
  ClipboardList
} from 'lucide-react'

// Helper para tratar inputs numéricos com vírgula e retornos inválidos
const parseInputFloat = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null
  const str = String(valor).replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

export default function PerfilPacienteView({ pacienteId, onBack, onEdit }) {
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingPaciente, setSavingPaciente] = useState(false)
  const [error, setError] = useState(null)
  const [sucessoMsg, setSucessoMsg] = useState(null)
  
  // Abas de Dados do Paciente
  const [activeAba, setActiveAba] = useState('pessoal') // 'pessoal' | 'clinico' | 'habitos'

  // Estados de Formulário do Paciente (Edição inline)
  const [formPaciente, setFormPaciente] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    nivel_atividade: '',
    medicamentos: '',
    suplementos: '',
    objetivos: [],
    objetivo_texto: '',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    refeicoes_por_dia: '',
    litros_agua: '',
    horario_acorda: '',
    horario_dorme: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  })

  // Estado do Modal de Nova Consulta
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formConsulta, setFormConsulta] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  })
  const [savingConsulta, setSavingConsulta] = useState(false)
  const [consultaError, setConsultaError] = useState(null)

  // Estado do Visualizador de Planos Alimentares
  const [selectedPlano, setSelectedPlano] = useState(null)

  useEffect(() => {
    if (pacienteId) {
      fetchPerfilData()
    }
  }, [pacienteId])

  async function fetchPerfilData() {
    try {
      setLoading(true)
      setError(null)

      // 1. Buscar dados do paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single()

      if (pacienteError) throw pacienteError
      setPaciente(pacienteData)
      
      // Popular formulário de edição
      setFormPaciente({
        nome: pacienteData.nome || '',
        data_nascimento: pacienteData.data_nascimento || '',
        sexo: pacienteData.sexo || '',
        whatsapp: pacienteData.whatsapp || '',
        email: pacienteData.email || '',
        peso_inicial: pacienteData.peso_inicial !== null ? String(pacienteData.peso_inicial) : '',
        altura: pacienteData.altura !== null ? String(pacienteData.altura) : '',
        nivel_atividade: pacienteData.nivel_atividade || '',
        medicamentos: pacienteData.medicamentos || '',
        suplementos: pacienteData.suplementos || '',
        objetivos: pacienteData.objetivos || [],
        objetivo_texto: pacienteData.objetivo_texto || '',
        patologias: pacienteData.patologias || [],
        restricoes_alimentares: pacienteData.restricoes_alimentares || [],
        alergias: pacienteData.alergias || [],
        refeicoes_por_dia: pacienteData.refeicoes_por_dia !== null ? String(pacienteData.refeicoes_por_dia) : '',
        litros_agua: pacienteData.litros_agua !== null ? String(pacienteData.litros_agua) : '',
        horario_acorda: pacienteData.horario_acorda || '',
        horario_dorme: pacienteData.horario_dorme || '',
        atividade_fisica: !!pacienteData.atividade_fisica,
        atividade_fisica_descricao: pacienteData.atividade_fisica_descricao || '',
        observacoes: pacienteData.observacoes || ''
      })

      // 2. Buscar histórico de consultas
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data_consulta', { ascending: false })

      if (consultasError) throw consultasError
      setConsultas(consultasData || [])

      // 3. Buscar histórico de planos alimentares
      const { data: planosData, error: planosError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })

      if (planosError) throw planosError
      setPlanos(planosData || [])

    } catch (err) {
      console.error('Erro ao buscar dados do perfil:', err)
      setError('Erro ao carregar o perfil do paciente.')
    } finally {
      setLoading(false)
    }
  }

  // Ações de salvamento de dados do paciente
  async function handleSalvarPaciente(e) {
    e.preventDefault()
    setSavingPaciente(true)
    setSucessoMsg(null)
    setError(null)

    try {
      const pesoFinal = parseInputFloat(formPaciente.peso_inicial)
      let alturaFinal = parseInputFloat(formPaciente.altura)

      if (alturaFinal && alturaFinal > 0.5 && alturaFinal < 3.0) {
        alturaFinal = alturaFinal * 100
      }

      const payload = {
        nome: formPaciente.nome,
        data_nascimento: formPaciente.data_nascimento || null,
        sexo: formPaciente.sexo || null,
        whatsapp: formPaciente.whatsapp || null,
        email: formPaciente.email || null,
        peso_inicial: pesoFinal,
        altura: alturaFinal,
        nivel_atividade: formPaciente.nivel_atividade || null,
        medicamentos: formPaciente.medicamentos || null,
        suplementos: formPaciente.suplementos || null,
        objetivos: formPaciente.objetivos,
        objetivo_texto: formPaciente.objetivo_texto || null,
        patologias: formPaciente.patologias,
        restricoes_alimentares: formPaciente.restricoes_alimentares,
        alergias: formPaciente.alergias,
        refeicoes_por_dia: formPaciente.refeicoes_por_dia ? parseInt(formPaciente.refeicoes_por_dia) : null,
        litros_agua: formPaciente.litros_agua ? parseFloat(formPaciente.litros_agua) : null,
        horario_acorda: formPaciente.horario_acorda || null,
        horario_dorme: formPaciente.horario_dorme || null,
        atividade_fisica: formPaciente.atividade_fisica,
        atividade_fisica_descricao: formPaciente.atividade_fisica ? formPaciente.atividade_fisica_descricao : null,
        observacoes: formPaciente.observacoes || null
      }

      const { data, error: updateError } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', pacienteId)
        .select()

      if (updateError) throw updateError
      if (data && data[0]) {
        setPaciente(data[0])
      }

      setSucessoMsg('Alterações salvas com sucesso!')
      setTimeout(() => setSucessoMsg(null), 3000)
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err)
      setError('Erro ao salvar alterações no banco de dados.')
    } finally {
      setSavingPaciente(false)
    }
  }

  // Ações de cadastro de nova consulta
  async function handleSalvarConsulta(e) {
    e.preventDefault()
    if (!formConsulta.peso) {
      setConsultaError('O peso atual é obrigatório.')
      return
    }

    setSavingConsulta(true)
    setConsultaError(null)

    try {
      const payload = {
        paciente_id: pacienteId,
        data_consulta: formConsulta.data_consulta,
        peso: parseInputFloat(formConsulta.peso),
        cintura: parseInputFloat(formConsulta.cintura) || null,
        quadril: parseInputFloat(formConsulta.quadril) || null,
        percentual_gordura: parseInputFloat(formConsulta.percentual_gordura) || null,
        observacoes: formConsulta.observacoes || null,
        proximo_retorno: formConsulta.proximo_retorno || null
      }

      const { error: insertError } = await supabase
        .from('consultas')
        .insert([payload])

      if (insertError) throw insertError

      // Fechar modal e limpar formulário
      setIsModalOpen(false)
      setFormConsulta({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      })

      // Recarregar dados de consultas do banco para sincronizar tudo em tempo real
      const { data: novasConsultas, error: reloadError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data_consulta', { ascending: false })

      if (reloadError) throw reloadError
      setConsultas(novasConsultas || [])

    } catch (err) {
      console.error('Erro ao cadastrar consulta:', err)
      setConsultaError('Erro ao registrar consulta. Tente novamente.')
    } finally {
      setSavingConsulta(false)
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return 'N/A'
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const formatarDataCompleta = (dateStr) => {
    if (!dateStr) return 'N/A'
    const data = new Date(dateStr)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Cálculo da Idade
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

  // Manipulação de Checkboxes/Arrays para objetivos, patologias, etc.
  const handleAbaCheckboxChange = (campo, valor) => {
    let listaAtual = [...formPaciente[campo]]
    if (listaAtual.includes(valor)) {
      listaAtual = listaAtual.filter(item => item !== valor)
    } else {
      listaAtual.push(valor)
    }
    setFormPaciente(prev => ({ ...prev, [campo]: listaAtual }))
  }

  // Render do Gráfico SVG de Evolução de Peso
  const renderGraficoPeso = () => {
    if (consultas.length === 0) {
      return (
        <div className="grafico-vazio">
          <TrendingUp size={48} style={{ color: 'var(--text)', opacity: 0.3 }} />
          <p>Nenhuma consulta registrada ainda</p>
        </div>
      )
    }

    // Ordenar cronologicamente do mais antigo para o mais recente para plotar o gráfico
    const consultasOrdenadas = [...consultas]
      .filter(c => c.peso !== null)
      .sort((a, b) => new Date(a.data_consulta) - new Date(b.data_consulta))

    if (consultasOrdenadas.length === 0) {
      return (
        <div className="grafico-vazio">
          <TrendingUp size={48} style={{ color: 'var(--text)', opacity: 0.3 }} />
          <p>Nenhum registro de peso nas consultas</p>
        </div>
      )
    }

    // Configurações do SVG
    const width = 500
    const height = 180
    const paddingLeft = 40
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 30

    const pesos = consultasOrdenadas.map(c => Number(c.peso))
    const minPeso = Math.min(...pesos) - 2
    const maxPeso = Math.max(...pesos) + 2
    const rangePeso = maxPeso - minPeso || 1

    const getX = (index) => {
      if (consultasOrdenadas.length === 1) return paddingLeft + (width - paddingLeft - paddingRight) / 2
      return paddingLeft + (index / (consultasOrdenadas.length - 1)) * (width - paddingLeft - paddingRight)
    }

    const getY = (peso) => {
      return height - paddingBottom - ((peso - minPeso) / rangePeso) * (height - paddingTop - paddingBottom)
    }

    // Gerar string de caminho do SVG (Path)
    let pathD = ''
    consultasOrdenadas.forEach((c, index) => {
      const x = getX(index)
      const y = getY(Number(c.peso))
      if (index === 0) {
        pathD += `M ${x} ${y}`
      } else {
        pathD += ` L ${x} ${y}`
      }
    })

    // Gerar a área sob a curva (para gradiente bonito)
    let areaD = ''
    if (consultasOrdenadas.length > 0) {
      const firstX = getX(0)
      const lastX = getX(consultasOrdenadas.length - 1)
      const bottomY = height - paddingBottom
      areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
    }

    return (
      <div className="grafico-container" style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontal */}
          <line x1={paddingLeft} y1={getY(minPeso)} x2={width - paddingRight} y2={getY(minPeso)} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={paddingLeft} y1={getY((minPeso + maxPeso) / 2)} x2={width - paddingRight} y2={getY((minPeso + maxPeso) / 2)} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={paddingLeft} y1={getY(maxPeso)} x2={width - paddingRight} y2={getY(maxPeso)} stroke="#f1f5f9" strokeWidth="1" />

          {/* Área preenchida */}
          {consultasOrdenadas.length > 1 && (
            <path d={areaD} fill="url(#areaGradient)" />
          )}

          {/* Linha principal */}
          <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Pontos de dados */}
          {consultasOrdenadas.map((c, index) => {
            const x = getX(index)
            const y = getY(Number(c.peso))
            return (
              <g key={c.id}>
                <circle cx={x} cy={y} r="5" fill="white" stroke="var(--accent)" strokeWidth="3" />
                {/* Rótulo de peso acima do ponto */}
                <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--text-h)">
                  {c.peso} kg
                </text>
                {/* Rótulo de data no eixo X */}
                <text x={x} y={height - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text)" opacity="0.8">
                  {c.data_consulta.split('-')[2]}/{c.data_consulta.split('-')[1]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
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

  return (
    <div className="perfil-container" style={{ paddingBottom: '4rem' }}>
      {/* Header com botão voltar */}
      <header className="perfil-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <button className="btn-back" onClick={onBack} title="Voltar">
            <ArrowLeft size={20} />
            <span>Voltar para Pacientes</span>
          </button>
          <h1 className="perfil-title" style={{ margin: 0 }}>Ficha do Paciente</h1>
        </div>
      </header>

      {sucessoMsg && (
        <div className="sucesso-alert-floating" style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          fontWeight: '700',
          marginBottom: '1.5rem',
          textAlign: 'left',
          animation: 'fadeIn 0.3s'
        }}>
          {sucessoMsg}
        </div>
      )}

      {/* Grid Geral de 3 colunas ou seções */}
      <div className="perfil-grid-novo" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 0.9fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* SEÇÃO 1: DADOS DO PACIENTE */}
        <section className="perfil-card-novo section-dados" style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow)', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div className="avatar-large" style={{ width: '48px', height: '48px', borderRadius: '14px', fontSize: '1.4rem', margin: 0 }}>
              {paciente.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-h)' }}>{paciente.nome}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text)', opacity: 0.8 }}>Cadastro em {formatarData(paciente.created_at?.split('T')[0])}</span>
            </div>
          </div>

          {/* Abas internas de dados */}
          <div className="perfil-aba-menu" style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1rem', marginBottom: '1.5rem' }}>
            {['pessoal', 'clinico', 'habitos'].map(aba => (
              <button
                key={aba}
                type="button"
                onClick={() => setActiveAba(aba)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.6rem 0.2rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: activeAba === aba ? 'var(--accent)' : 'var(--text)',
                  borderBottom: activeAba === aba ? '3px solid var(--accent)' : '3px solid transparent',
                  marginBottom: '-1px',
                  textTransform: 'capitalize'
                }}
              >
                {aba}
              </button>
            ))}
          </div>

          {/* Form de Edição Direta de Dados */}
          <form onSubmit={handleSalvarPaciente}>
            {activeAba === 'pessoal' && (
              <div className="aba-perfil-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formPaciente.nome}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, nome: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formPaciente.data_nascimento}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Sexo</label>
                  <select
                    value={formPaciente.sexo}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, sexo: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>E-mail</label>
                  <input
                    type="email"
                    value={formPaciente.email}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>WhatsApp</label>
                  <input
                    type="text"
                    value={formPaciente.whatsapp}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, whatsapp: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>
            )}

            {activeAba === 'clinico' && (
              <div className="aba-perfil-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group-perfil">
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formPaciente.peso_inicial}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, peso_inicial: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div className="form-group-perfil">
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Altura (cm)</label>
                    <input
                      type="number"
                      value={formPaciente.altura}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, altura: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Nível de Atividade</label>
                  <select
                    value={formPaciente.nivel_atividade}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, nivel_atividade: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <option value="">Selecione...</option>
                    <option value="Sedentário">Sedentário</option>
                    <option value="Levemente ativo">Levemente ativo</option>
                    <option value="Moderadamente ativo">Moderadamente ativo</option>
                    <option value="Muito ativo">Muito ativo</option>
                    <option value="Extremamente ativo">Extremamente ativo</option>
                  </select>
                </div>

                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Medicamentos</label>
                  <input
                    type="text"
                    value={formPaciente.medicamentos}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, medicamentos: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Suplementos</label>
                  <input
                    type="text"
                    value={formPaciente.suplementos}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, suplementos: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>

                {/* Detalhamento do Objetivo */}
                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Detalhamento do Objetivo</label>
                  <textarea
                    rows="2"
                    value={formPaciente.objetivo_texto}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, objetivo_texto: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {activeAba === 'habitos' && (
              <div className="aba-perfil-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group-perfil">
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Refeições / Dia</label>
                    <input
                      type="number"
                      value={formPaciente.refeicoes_por_dia}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, refeicoes_por_dia: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div className="form-group-perfil">
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Água (L/dia)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formPaciente.litros_agua}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, litros_agua: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group-perfil">
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Horário Acorda</label>
                    <input
                      type="text"
                      value={formPaciente.horario_acorda}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, horario_acorda: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div className="form-group-perfil">
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Horário Dorme</label>
                    <input
                      type="text"
                      value={formPaciente.horario_dorme}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, horario_dorme: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>

                <div className="form-group-perfil">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-h)', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formPaciente.atividade_fisica}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, atividade_fisica: e.target.checked }))}
                      style={{ width: 'auto', transform: 'scale(1.15)' }}
                    />
                    Pratica Atividade Física
                  </label>
                  {formPaciente.atividade_fisica && (
                    <input
                      type="text"
                      placeholder="Descrição da atividade (frequência, tipo)"
                      value={formPaciente.atividade_fisica_descricao}
                      onChange={(e) => setFormPaciente(prev => ({ ...prev, atividade_fisica_descricao: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', marginTop: '0.4rem' }}
                    />
                  )}
                </div>

                <div className="form-group-perfil">
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '0.4rem' }}>Considerações Finais / Observações</label>
                  <textarea
                    rows="3"
                    value={formPaciente.observacoes}
                    onChange={(e) => setFormPaciente(prev => ({ ...prev, observacoes: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPaciente}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                justifyContent: 'center',
                padding: '0.75rem',
                fontSize: '0.95rem',
                gap: '0.5rem',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {savingPaciente ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Salvar alterações</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* SEÇÃO 2: CONSULTAS */}
        <section className="perfil-card-novo section-consultas" style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-h)' }}>Consultas & Evolução</h2>
            <button 
              className="btn-primary" 
              onClick={() => setIsModalOpen(true)}
              style={{ padding: '0.55rem 1rem', borderRadius: '10px', fontSize: '0.85rem', gap: '0.4rem', boxShadow: 'none' }}
            >
              <Plus size={16} />
              <span>Nova Consulta</span>
            </button>
          </div>

          {/* Gráfico de Evolução de Peso */}
          <div className="grafico-card-wrapper" style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              Evolução do Peso
            </h3>
            {renderGraficoPeso()}
          </div>

          {/* Lista de Consultas */}
          <div className="lista-consultas-wrapper">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-h)' }}>Histórico de Consultas</h3>
            
            {consultas.length > 0 ? (
              <div className="consult-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {consultas.map((c) => (
                  <div key={c.id} className="consulta-item-premium" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: '#fcfdfd', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent)', background: 'var(--accent-bg)', padding: '0.2rem 0.6rem', borderRadius: '50px' }}>
                        {formatarData(c.data_consulta)}
                      </span>
                      {c.proximo_retorno && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c2410c', background: '#ffedd5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          Retorno: {formatarData(c.proximo_retorno)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.8, fontWeight: '600' }}>Peso</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>{c.peso ? `${c.peso} kg` : '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.8, fontWeight: '600' }}>Cintura</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>{c.cintura ? `${c.cintura} cm` : '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.8, fontWeight: '600' }}>Quadril</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>{c.quadril ? `${c.quadril} cm` : '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.8, fontWeight: '600' }}>% Gordura</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</strong>
                      </div>
                    </div>

                    {c.observacoes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'white', padding: '0.6rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <strong>Obs:</strong> {c.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border)', color: 'var(--text)', opacity: 0.8 }}>
                <ClipboardList size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <span>Nenhuma consulta cadastrada ainda.</span>
              </div>
            )}
          </div>
        </section>

        {/* SEÇÃO 3: PLANOS ALIMENTARES */}
        <section className="perfil-card-novo section-planos" style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow)', textAlign: 'left' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 1rem 0', color: 'var(--text-h)' }}>Planos Alimentares</h2>
            
            {/* Botão Gerar Plano Alimentar */}
            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.75rem',
                fontSize: '0.95rem',
                gap: '0.5rem',
                background: 'var(--gold)',
                color: 'var(--text-h)',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 180, 131, 0.25)'
              }}
            >
              <Apple size={18} />
              <span>Gerar Plano Alimentar</span>
            </button>
          </div>

          {/* Histórico de Planos Alimentares */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-h)' }}>Histórico de Planos</h3>
            
            {planos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {planos.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedPlano(p)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.9rem 1.1rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="plano-historico-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} style={{ color: 'var(--accent)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-h)' }}>Plano Alimentar</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.7 }}>Gerado em {formatarDataCompleta(p.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text)', opacity: 0.5 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--text)', opacity: 0.8 }}>
                <Apple size={32} style={{ marginBottom: '0.5rem', opacity: 0.5, display: 'inline-block' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhum plano alimentar gerado ainda.</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* MODAL: NOVA CONSULTA */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '90%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Registrar Nova Consulta</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
              >
                <X size={20} />
              </button>
            </div>

            {consultaError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: '600' }}>
                {consultaError}
              </div>
            )}

            <form onSubmit={handleSalvarConsulta} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Data da Consulta *</label>
                <input 
                  type="date" 
                  required
                  value={formConsulta.data_consulta}
                  onChange={(e) => setFormConsulta(prev => ({ ...prev, data_consulta: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Peso Atual (kg) *</label>
                <input 
                  type="number" 
                  step="0.1" 
                  required
                  placeholder="Ex: 75.4"
                  value={formConsulta.peso}
                  onChange={(e) => setFormConsulta(prev => ({ ...prev, peso: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Cintura (cm)</label>
                  <input 
                    type="number" 
                    placeholder="Opcional"
                    value={formConsulta.cintura}
                    onChange={(e) => setFormConsulta(prev => ({ ...prev, cintura: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Quadril (cm)</label>
                  <input 
                    type="number" 
                    placeholder="Opcional"
                    value={formConsulta.quadril}
                    onChange={(e) => setFormConsulta(prev => ({ ...prev, quadril: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>% de Gordura</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Opcional"
                  value={formConsulta.percentual_gordura}
                  onChange={(e) => setFormConsulta(prev => ({ ...prev, percentual_gordura: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea 
                  rows="3" 
                  placeholder="Anotações gerais sobre a consulta..."
                  value={formConsulta.observacoes}
                  onChange={(e) => setFormConsulta(prev => ({ ...prev, observacoes: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Próximo Retorno</label>
                <input 
                  type="date" 
                  value={formConsulta.proximo_retorno}
                  onChange={(e) => setFormConsulta(prev => ({ ...prev, proximo_retorno: e.target.value }))}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={savingConsulta}
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', boxShadow: 'none' }}
                >
                  {savingConsulta ? 'Salvando...' : 'Salvar consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE PLANO ALIMENTAR */}
      {selectedPlano && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Visualizar Plano Alimentar</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.8 }}>Gerado em {formatarDataCompleta(selectedPlano.created_at)}</span>
              </div>
              <button 
                onClick={() => setSelectedPlano(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '450px', overflowY: 'auto', textAlign: 'left', paddingRight: '0.5rem' }}>
              {selectedPlano.conteudo ? (
                typeof selectedPlano.conteudo === 'string' ? (
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedPlano.conteudo}</p>
                ) : (
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.6 }}>
                    {JSON.stringify(selectedPlano.conteudo, null, 2)}
                  </pre>
                )
              ) : (
                <p>Nenhum conteúdo salvo para este plano alimentício.</p>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedPlano(null)}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '10px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
