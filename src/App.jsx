import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Loader2 } from 'lucide-react'
import Auth from './Auth'
import Sidebar from './components/Sidebar'
import DashboardView from './components/DashboardView'
import PacientesView from './components/PacientesView'
import PerfilPacienteView from './components/PerfilPacienteView'
import CadastroPacienteView from './components/CadastroPacienteView'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'pacientes' | 'perfil' | 'cadastro'
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [pacienteIdParaEditar, setPacienteIdParaEditar] = useState(null)

  useEffect(() => {
    // Pegar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
    })

    // Ouvir mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // Se deslogar, reseta as abas
      if (!session) {
        setActiveTab('dashboard')
        setSelectedPatientId(null)
        setPacienteIdParaEditar(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!initialized) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} color="var(--accent)" />
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app-layout">
      {/* Menu Lateral Fixo */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setSelectedPatientId(null) // Limpa o paciente selecionado se mudar de aba
          setPacienteIdParaEditar(null) // Limpa o ID de edição se mudar de aba
        }} 
        onLogout={() => supabase.auth.signOut()} 
      />

      {/* Área Principal de Conteúdo */}
      <main className="app-main-content">
        {activeTab === 'dashboard' && (
          <DashboardView 
            session={session} 
            onSelectPatient={(id) => {
              setSelectedPatientId(id)
              setActiveTab('perfil')
            }} 
          />
        )}
        
        {activeTab === 'pacientes' && (
          <PacientesView 
            session={session} 
            onNovoPaciente={() => {
              setPacienteIdParaEditar(null)
              setActiveTab('cadastro')
            }}
            onSelectPatient={(id) => {
              setSelectedPatientId(id)
              setActiveTab('perfil')
            }} 
          />
        )}

        {activeTab === 'cadastro' && (
          <CadastroPacienteView 
            session={session}
            pacienteIdParaEditar={pacienteIdParaEditar}
            onBack={() => {
              if (pacienteIdParaEditar) {
                setActiveTab('perfil')
              } else {
                setActiveTab('pacientes')
              }
              setPacienteIdParaEditar(null)
            }}
            onCadastroSucesso={(id) => {
              setSelectedPatientId(id)
              setPacienteIdParaEditar(null)
              setActiveTab('perfil')
            }}
          />
        )}

        {activeTab === 'perfil' && selectedPatientId && (
          <PerfilPacienteView 
            pacienteId={selectedPatientId} 
            onBack={() => setActiveTab('pacientes')} 
            onEdit={() => {
              setPacienteIdParaEditar(selectedPatientId)
              setActiveTab('cadastro')
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
