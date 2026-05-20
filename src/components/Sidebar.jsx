import React from 'react'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        Nutri<span>A+</span>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'pacientes' || activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('pacientes')}
        >
          <Users size={20} />
          <span>Pacientes</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <button className="btn-sidebar-logout" onClick={onLogout} title="Sair do sistema">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
