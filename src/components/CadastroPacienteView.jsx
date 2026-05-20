import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

// Helper para tratar inputs numéricos com vírgula e retornos inválidos
const parseInputFloat = (valor) => {
  if (valor === undefined || valor === null || valor === '') return 0
  const str = String(valor).replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

export default function CadastroPacienteView({ session, pacienteIdParaEditar, onBack, onCadastroSucesso }) {
  const [activeAba, setActiveAba] = useState('pessoal') // 'pessoal' | 'clinico' | 'habitos'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(null)

  // Carregar dados caso seja modo de edição
  useEffect(() => {
    if (pacienteIdParaEditar) {
      buscarDadosPacienteEdicao()
    }
  }, [pacienteIdParaEditar])

  async function buscarDadosPacienteEdicao() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteIdParaEditar)
        .single()

      if (error) throw error
      if (data) {
        setForm({
          nome: data.nome || '',
          data_nascimento: data.data_nascimento || '',
          sexo: data.sexo || '',
          telefone: '', // Campo visual da UI
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          
          // Clínico
          peso_inicial: data.peso_inicial !== null && data.peso_inicial !== undefined ? String(data.peso_inicial) : '',
          altura: data.altura !== null && data.altura !== undefined ? String(data.altura) : '',
          objetivos: data.objetivos || [],
          objetivo_texto: data.objetivo_texto || '',
          nivel_atividade: data.nivel_atividade || '',
          patologias: data.patologias || [],
          patologia_livre: '',
          restricoes_alimentares: data.restricoes_alimentares || [],
          restricao_livre: '',
          alergias: data.alergias || [],
          alergia_livre: '',
          medicamentos: data.medicamentos || '',
          suplementos: data.suplementos || '',
          
          // Hábitos
          refeicoes_por_dia: data.refeicoes_por_dia !== null && data.refeicoes_por_dia !== undefined ? String(data.refeicoes_por_dia) : '',
          horario_acorda: data.horario_acorda || '',
          horario_dorme: data.horario_dorme || '',
          litros_agua: data.litros_agua !== null && data.litros_agua !== undefined ? String(data.litros_agua) : '',
          pratica_atividade: data.atividade_fisica ? 'Sim' : 'Não',
          atividade_fisica_descricao: data.atividade_fisica_descricao || '',
          observacoes: data.observacoes || ''
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados para edição:', err)
      setError('Não foi possível carregar os dados do paciente para edição.')
    } finally {
      setLoading(false)
    }
  }

  // Estado geral do formulário
  const [form, setForm] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    
    // Clínico
    peso_inicial: '',
    altura: '',
    objetivos: [], // array text[]
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [], // array text[]
    patologia_livre: '',
    restricoes_alimentares: [], // array text[]
    restricao_livre: '',
    alergias: [], // array text[]
    alergia_livre: '',
    medicamentos: '',
    suplementos: '',
    
    // Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    pratica_atividade: 'Não', // Sim / Não para UI
    atividade_fisica_descricao: '',
    observacoes: ''
  })

  // Idade calculada reativamente
  const [idade, setIdade] = useState('')
  useEffect(() => {
    if (form.data_nascimento) {
      const hoje = new Date()
      const nascimento = new Date(form.data_nascimento + 'T00:00:00')
      let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear()
      const mes = hoje.getMonth() - nascimento.getMonth()
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idadeCalculada--
      }
      setIdade(idadeCalculada >= 0 ? `${idadeCalculada} anos` : '')
    } else {
      setIdade('')
    }
  }, [form.data_nascimento])

  // IMC calculado reativamente com suporte inteligente a metros/cm
  const [imcData, setImcData] = useState({ imc: '', classe: '', cor: '' })
  useEffect(() => {
    const peso = parseInputFloat(form.peso_inicial)
    let altura = parseInputFloat(form.altura)
    if (peso && altura) {
      // Ajuste inteligente: se digitou em metros (ex: 1.9 ou 1.65), converte para cm (190 ou 165)
      if (altura > 0.5 && altura < 3.0) {
        altura = altura * 100
      }
      const altMetros = altura / 100
      const imcValor = peso / (altMetros * altMetros)
      const imcFmt = imcValor.toFixed(2)
      
      let classe = ''
      let cor = ''
      if (imcValor < 18.5) {
        classe = 'Abaixo do peso'
        cor = '#3b82f6'
      } else if (imcValor < 25) {
        classe = 'Peso normal'
        cor = '#2E7D32'
      } else if (imcValor < 30) {
        classe = 'Sobrepeso'
        cor = '#d97706'
      } else if (imcValor < 35) {
        classe = 'Obesidade Grau I'
        cor = '#ea580c'
      } else if (imcValor < 40) {
        classe = 'Obesidade Grau II'
        cor = '#dc2626'
      } else {
        classe = 'Obesidade Grau III'
        cor = '#7f1d1d'
      }
      setImcData({ imc: imcFmt, classe, cor })
    } else {
      setImcData({ imc: '', classe: '', cor: '' })
    }
  }, [form.peso_inicial, form.altura])

  // Formatação de telefone brasileira
  const handleTelefoneChange = (campo, valor) => {
    const apenasDigitos = valor.replace(/\D/g, '')
    let formatado = apenasDigitos
    if (apenasDigitos.length <= 10) {
      formatado = apenasDigitos.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
    } else {
      formatado = apenasDigitos.slice(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3')
    }
    setForm(prev => ({ ...prev, [campo]: formatado }))
  }

  // Conversão de hora no onBlur (ex: 6 -> 06:00, 2230 -> 22:30)
  const handleHoraBlur = (campo, valor) => {
    const apenasDigitos = valor.replace(/\D/g, '')
    if (!apenasDigitos) return
    
    let hora = '00'
    let minuto = '00'
    
    if (apenasDigitos.length <= 2) {
      const h = parseInt(apenasDigitos)
      hora = String(h >= 0 && h <= 23 ? h : 0).padStart(2, '0')
    } else if (apenasDigitos.length === 3) {
      const h = parseInt(apenasDigitos.slice(0, 1))
      const m = parseInt(apenasDigitos.slice(1, 3))
      hora = String(h).padStart(2, '0')
      minuto = String(m >= 0 && m <= 59 ? m : 0).padStart(2, '0')
    } else {
      const h = parseInt(apenasDigitos.slice(0, 2))
      const m = parseInt(apenasDigitos.slice(2, 4))
      hora = String(h >= 0 && h <= 23 ? h : 0).padStart(2, '0')
      minuto = String(m >= 0 && m <= 59 ? m : 0).padStart(2, '0')
    }
    
    setForm(prev => ({ ...prev, [campo]: `${hora}:${minuto}` }))
  }

  // Lógica de seleção múltipla (Checkboxes) para arrays
  const handleCheckboxChange = (campo, valor, isNenhum = false) => {
    let listaAtual = [...form[campo]]
    
    if (isNenhum) {
      // Se marcar "Nenhum", limpa as outras seleções
      if (listaAtual.includes('Nenhum')) {
        listaAtual = []
      } else {
        listaAtual = ['Nenhum']
      }
    } else {
      // Se marcar qualquer outra opção, remove "Nenhum" da lista
      listaAtual = listaAtual.filter(item => item !== 'Nenhum')
      
      if (listaAtual.includes(valor)) {
        listaAtual = listaAtual.filter(item => item !== valor)
      } else {
        listaAtual.push(valor)
      }
    }
    
    setForm(prev => ({ ...prev, [campo]: listaAtual }))
  }

  async function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome) {
      setError('O nome completo é obrigatório.')
      setActiveAba('pessoal')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar os arrays combinando com os campos adicionais livres
      const arrayPatologias = [...form.patologias]
      if (form.patologia_livre.trim() && !arrayPatologias.includes('Nenhum')) {
        arrayPatologias.push(form.patologia_livre.trim())
      }

      const arrayRestricoes = [...form.restricoes_alimentares]
      if (form.restricao_livre.trim() && !arrayRestricoes.includes('Nenhum')) {
        arrayRestricoes.push(form.restricao_livre.trim())
      }

      const arrayAlergias = [...form.alergias]
      if (form.alergia_livre.trim() && !arrayAlergias.includes('Nenhum')) {
        arrayAlergias.push(form.alergia_livre.trim())
      }

      // Sanitização de peso e altura com suporte inteligente a metros/cm e vírgulas
      let pesoFinal = form.peso_inicial ? parseInputFloat(form.peso_inicial) : null
      let alturaFinal = form.altura ? parseInputFloat(form.altura) : null
      
      if (alturaFinal && alturaFinal > 0.5 && alturaFinal < 3.0) {
        alturaFinal = alturaFinal * 100
      }

      // Montar payload final para o Supabase
      const payload = {
        nutricionista_id: session.user.id,
        nome: form.nome,
        data_nascimento: form.data_nascimento || null,
        sexo: form.sexo || null,
        // telefone: não existe na tabela pacientes (removido para evitar erro de schema)
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        
        // Clínico
        peso_inicial: pesoFinal,
        altura: alturaFinal,
        objetivos: form.objetivos,
        objetivo_texto: form.objetivo_texto || null,
        nivel_atividade: form.nivel_atividade || null,
        patologias: arrayPatologias,
        restricoes_alimentares: arrayRestricoes,
        alergias: arrayAlergias,
        medicamentos: form.medicamentos || null,
        suplementos: form.suplementos || null,
        
        // Hábitos
        refeicoes_por_dia: form.refeicoes_por_dia ? parseInt(form.refeicoes_por_dia) : null,
        horario_acorda: form.horario_acorda || null,
        horario_dorme: form.horario_dorme || null,
        litros_agua: form.litros_agua ? parseFloat(form.litros_agua) : null,
        atividade_fisica: form.pratica_atividade === 'Sim',
        atividade_fisica_descricao: form.pratica_atividade === 'Sim' ? form.atividade_fisica_descricao : null,
        observacoes: form.observacoes || null
      }

      let query
      if (pacienteIdParaEditar) {
        query = supabase
          .from('pacientes')
          .update(payload)
          .eq('id', pacienteIdParaEditar)
      } else {
        query = supabase
          .from('pacientes')
          .insert([payload])
      }

      const { data, error: saveError } = await query.select()

      if (saveError) throw saveError

      setSucesso(pacienteIdParaEditar ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!')
      
      // Feedback temporário e redirecionamento para o perfil
      setTimeout(() => {
        onCadastroSucesso(data[0].id)
      }, 1500)

    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err)
      const msgErro = err.message || err.details || 'Verifique a conexão e tente novamente.'
      setError(`Erro ao salvar no banco de dados: ${msgErro}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cadastro-paciente-container">
      <header className="perfil-header">
        <button className="btn-back" onClick={onBack} title="Voltar">
          <ArrowLeft size={20} />
          <span>{pacienteIdParaEditar ? 'Voltar para Perfil' : 'Voltar para Listagem'}</span>
        </button>
        <h1 className="perfil-title">{pacienteIdParaEditar ? 'Editar Paciente' : 'Novo Paciente'}</h1>
      </header>

      {error && <div className="error-alert">{error}</div>}
      {sucesso && <div className="sucesso-alert" style={{
        background: '#dcfce7',
        color: '#15803d',
        padding: '1.25rem 2rem',
        borderRadius: '14px',
        border: '1px solid #bbf7d0',
        fontWeight: '600',
        marginBottom: '1.5rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>{sucesso}</div>}

      <div className="cadastro-card">
        {/* Menu das Abas */}
        <div className="tabs-menu" style={{
          display: 'flex',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2.5rem',
          gap: '1.5rem'
        }}>
          <button 
            type="button"
            className={`tab-btn ${activeAba === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveAba('pessoal')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeAba === 'pessoal' ? 'var(--accent)' : 'var(--text)',
              borderBottom: activeAba === 'pessoal' ? '3px solid var(--accent)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Pessoal
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeAba === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveAba('clinico')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeAba === 'clinico' ? 'var(--accent)' : 'var(--text)',
              borderBottom: activeAba === 'clinico' ? '3px solid var(--accent)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Clínico
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeAba === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveAba('habitos')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeAba === 'habitos' ? 'var(--accent)' : 'var(--text)',
              borderBottom: activeAba === 'habitos' ? '3px solid var(--accent)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Hábitos
          </button>
        </div>

        <form onSubmit={handleSalvar}>
          {/* Aba 1: Pessoal */}
          {activeAba === 'pessoal' && (
            <div className="aba-content">
              <div className="form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={form.nome}
                  onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Maria Oliveira Silva"
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={form.data_nascimento}
                    onChange={(e) => setForm(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Idade (Calculada)</label>
                  <input 
                    type="text" 
                    disabled 
                    value={idade || 'Preencha a data de nascimento'} 
                    style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Sexo</label>
                  <select 
                    value={form.sexo}
                    onChange={(e) => setForm(prev => ({ ...prev, sexo: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-h)',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>E-mail</label>
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Telefone Fixo</label>
                  <input 
                    type="text" 
                    value={form.telefone}
                    onChange={(e) => handleTelefoneChange('telefone', e.target.value)}
                    placeholder="(11) 4444-4444"
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input 
                    type="text" 
                    value={form.whatsapp}
                    onChange={(e) => handleTelefoneChange('whatsapp', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba 2: Clínico */}
          {activeAba === 'clinico' && (
            <div className="aba-content">
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
                  <label>Peso Atual (kg)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      step="0.1"
                      value={form.peso_inicial}
                      onChange={(e) => setForm(prev => ({ ...prev, peso_inicial: e.target.value }))}
                      placeholder="80.5"
                    />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text)', opacity: 0.6 }}>kg</span>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
                  <label>Altura (cm)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      value={form.altura}
                      onChange={(e) => setForm(prev => ({ ...prev, altura: e.target.value }))}
                      placeholder="175"
                    />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text)', opacity: 0.6 }}>cm</span>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>IMC (Calculado)</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    height: '52px',
                    padding: '0 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: '#f1f5f9',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    color: imcData.cor || '#64748b',
                    boxSizing: 'border-box'
                  }}>
                    {imcData.imc ? `${imcData.imc} - ${imcData.classe}` : 'Preencha peso e altura'}
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Objetivos alimentares (Múltipla Escolha)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map((obj) => (
                    <label key={obj} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                      <input 
                        type="checkbox"
                        checked={form.objetivos.includes(obj)}
                        onChange={() => handleCheckboxChange('objetivos', obj)}
                        style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      {obj}
                    </label>
                  ))}
                </div>
                <label style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>Detalhamento / Texto livre do Objetivo:</label>
                <input 
                  type="text" 
                  value={form.objetivo_texto}
                  onChange={(e) => setForm(prev => ({ ...prev, objetivo_texto: e.target.value }))}
                  placeholder="Ex: Paciente deseja perder gordura para se preparar para corrida de rua..."
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nível de Atividade Física</label>
                  <select 
                    value={form.nivel_atividade}
                    onChange={(e) => setForm(prev => ({ ...prev, nivel_atividade: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-h)',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="Sedentário">Sedentário (Pouco ou nenhum exercício)</option>
                    <option value="Levemente ativo">Levemente ativo (Exercício leve 1-3 dias/semana)</option>
                    <option value="Moderadamente ativo">Moderadamente ativo (Exercício moderado 3-5 dias/semana)</option>
                    <option value="Muito ativo">Muito ativo (Exercício intenso 6-7 dias/semana)</option>
                    <option value="Extremamente ativo">Extremamente ativo (Treino pesado profissional/trabalho físico)</option>
                  </select>
                </div>
              </div>

              {/* Patologias */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Patologias / Condições de Saúde</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent)' }}>
                    <input 
                      type="checkbox"
                      checked={form.patologias.includes('Nenhum')}
                      onChange={() => handleCheckboxChange('patologias', 'Nenhum', true)}
                      style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                    Nenhum
                  </label>
                  {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map((pat) => (
                    <label key={pat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                      <input 
                        type="checkbox"
                        disabled={form.patologias.includes('Nenhum')}
                        checked={form.patologias.includes(pat)}
                        onChange={() => handleCheckboxChange('patologias', pat)}
                        style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      {pat}
                    </label>
                  ))}
                </div>
                <label style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>Outra Patologia / Condição de Saúde:</label>
                <input 
                  type="text" 
                  disabled={form.patologias.includes('Nenhum')}
                  value={form.patologia_livre}
                  onChange={(e) => setForm(prev => ({ ...prev, patologia_livre: e.target.value }))}
                  placeholder="Ex: Gastrite crônica, Asma..."
                />
              </div>

              {/* Restrições Alimentares */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Restrições Alimentares</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent)' }}>
                    <input 
                      type="checkbox"
                      checked={form.restricoes_alimentares.includes('Nenhum')}
                      onChange={() => handleCheckboxChange('restricoes_alimentares', 'Nenhum', true)}
                      style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                    Nenhum
                  </label>
                  {['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map((res) => (
                    <label key={res} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                      <input 
                        type="checkbox"
                        disabled={form.restricoes_alimentares.includes('Nenhum')}
                        checked={form.restricoes_alimentares.includes(res)}
                        onChange={() => handleCheckboxChange('restricoes_alimentares', res)}
                        style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      {res}
                    </label>
                  ))}
                </div>
                <label style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>Outra Restrição Alimentar:</label>
                <input 
                  type="text" 
                  disabled={form.restricoes_alimentares.includes('Nenhum')}
                  value={form.restricao_livre}
                  onChange={(e) => setForm(prev => ({ ...prev, restricao_livre: e.target.value }))}
                  placeholder="Ex: Dietas vegetarianas, Sem cebola..."
                />
              </div>

              {/* Alergias Alimentares */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Alergias Alimentares</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent)' }}>
                    <input 
                      type="checkbox"
                      checked={form.alergias.includes('Nenhum')}
                      onChange={() => handleCheckboxChange('alergias', 'Nenhum', true)}
                      style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                    Nenhum
                  </label>
                  {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map((ale) => (
                    <label key={ale} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                      <input 
                        type="checkbox"
                        disabled={form.alergias.includes('Nenhum')}
                        checked={form.alergias.includes(ale)}
                        onChange={() => handleCheckboxChange('alergias', ale)}
                        style={{ width: 'auto', marginRight: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      {ale}
                    </label>
                  ))}
                </div>
                <label style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>Outra Alergia Alimentar:</label>
                <input 
                  type="text" 
                  disabled={form.alergias.includes('Nenhum')}
                  value={form.alergia_livre}
                  onChange={(e) => setForm(prev => ({ ...prev, alergia_livre: e.target.value }))}
                  placeholder="Ex: Corante amarelo tartrazina, Castanhas..."
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Medicamentos Contínuos</label>
                  <input 
                    type="text" 
                    value={form.medicamentos}
                    onChange={(e) => setForm(prev => ({ ...prev, medicamentos: e.target.value }))}
                    placeholder="Ex: Puran T4 50mcg..."
                  />
                </div>
                <div className="form-group">
                  <label>Suplementos em Uso</label>
                  <input 
                    type="text" 
                    value={form.suplementos}
                    onChange={(e) => setForm(prev => ({ ...prev, suplementos: e.target.value }))}
                    placeholder="Ex: Creatina 5g, Whey Protein..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Hábitos */}
          {activeAba === 'habitos' && (
            <div className="aba-content">
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Quantas refeições faz por dia?</label>
                  <input 
                    type="number" 
                    value={form.refeicoes_por_dia}
                    onChange={(e) => setForm(prev => ({ ...prev, refeicoes_por_dia: e.target.value }))}
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
                  <label>Quantidade de água por dia</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      step="0.1"
                      value={form.litros_agua}
                      onChange={(e) => setForm(prev => ({ ...prev, litros_agua: e.target.value }))}
                      placeholder="Ex: 2.5"
                    />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text)', opacity: 0.6 }}>litros</span>
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Horário que acorda (número)</label>
                  <input 
                    type="text" 
                    value={form.horario_acorda}
                    onChange={(e) => setForm(prev => ({ ...prev, horario_acorda: e.target.value }))}
                    onBlur={(e) => handleHoraBlur('horario_acorda', e.target.value)}
                    placeholder="Ex: 6 ou 630"
                  />
                  <small style={{ color: 'var(--text)', opacity: 0.6, fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Será convertido para formato de hora (ex: 630 → 06:30)</small>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Horário que dorme (número)</label>
                  <input 
                    type="text" 
                    value={form.horario_dorme}
                    onChange={(e) => setForm(prev => ({ ...prev, horario_dorme: e.target.value }))}
                    onBlur={(e) => handleHoraBlur('horario_dorme', e.target.value)}
                    placeholder="Ex: 23 ou 2230"
                  />
                  <small style={{ color: 'var(--text)', opacity: 0.6, fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Será convertido para formato de hora (ex: 2230 → 22:30)</small>
                </div>
              </div>

              <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Pratica atividade física?</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
                    <input 
                      type="radio" 
                      name="pratica_atividade"
                      value="Sim"
                      checked={form.pratica_atividade === 'Sim'}
                      onChange={(e) => setForm(prev => ({ ...prev, pratica_atividade: e.target.value }))}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    Sim
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
                    <input 
                      type="radio" 
                      name="pratica_atividade"
                      value="Não"
                      checked={form.pratica_atividade === 'Não'}
                      onChange={(e) => setForm(prev => ({ ...prev, pratica_atividade: e.target.value }))}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    Não
                  </label>
                </div>

                {form.pratica_atividade === 'Sim' && (
                  <div>
                    <label style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>Qual atividade e frequência semanal?</label>
                    <input 
                      type="text" 
                      value={form.atividade_fisica_descricao}
                      onChange={(e) => setForm(prev => ({ ...prev, atividade_fisica_descricao: e.target.value }))}
                      placeholder="Ex: Musculação 4x na semana, Corrida aos sábados..."
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Observações Gerais / Anotações</label>
                <textarea 
                  value={form.observacoes}
                  onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Preencha qualquer detalhe ou consideração complementar relevante sobre os hábitos do paciente..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-h)',
                    boxSizing: 'border-box',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {/* Ações Finais do Formulário */}
          <div className="form-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '2.5rem',
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem'
          }}>
            <button type="button" className="btn-secondary" onClick={onBack}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{pacienteIdParaEditar ? 'Salvar Alterações' : 'Salvar Paciente'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
