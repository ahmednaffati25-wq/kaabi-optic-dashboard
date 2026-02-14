import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import AddClientForm from "./components/AddClientForm";
import ClientHistoryTable from "./components/ClientHistoryTable";
import AdminPanel from "./components/AdminPanel"; // تأكد أنك أنشأت هذا الملف

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Tab State
  
  const [stats, setStats] = useState({ 
    totalDettes: 0, 
    totalClients: 0, 
    overdue: 0, 
    paidAmount: 0, 
    recoveryRate: 0 
  });
  const [note, setNote] = useState(localStorage.getItem("kaabi_note") || "");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) calculateStats();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) calculateStats();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshKey]);

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    localStorage.setItem("kaabi_note", e.target.value);
  };

  const calculateStats = async () => {
    const { data } = await supabase.from("client_history_full").select("*");
    if (data) {
      const totalRest = data.reduce((acc, curr) => acc + (curr.remaining_client_balance || 0), 0);
      const totalPaid = data.reduce((acc, curr) => acc + (curr.total_paid || 0), 0);
      const grandTotal = totalRest + totalPaid;
      const rate = grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : 0;
      const today = new Date().toISOString().split('T')[0];
      const overdue = data.filter(c => c.promise_date && c.promise_date < today && c.remaining_client_balance > 0).length;

      setStats({ 
        totalDettes: totalRest, 
        totalClients: data.length, 
        overdue: overdue,
        paidAmount: totalPaid,
        recoveryRate: rate
      });
    }
  };

  const exportReport = () => {
    const report = `=== RAPPORT KAABI OPTIC ===\nDate: ${new Date().toLocaleString()}\nTotal Clients: ${stats.totalClients}\nDettes: ${stats.totalDettes.toFixed(3)} DT\nEncaissé: ${stats.paidAmount.toFixed(3)} DT\nRecouvrement: ${stats.recoveryRate}%\n=== END ===`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  if (loading) return <div style={loadS}><h2>🚀 Chargement du Système KAABI...</h2></div>;
  if (!session) return <Login />;

  const bg = darkMode ? "#0f172a" : "#f1f5f9";
  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const textColor = darkMode ? "#f8fafc" : "#1e293b";
  const borderColor = darkMode ? "#334155" : "#cbd5e1";
  const inputBg = darkMode ? "#334155" : "#f8fafc";

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", transition: "0.3s" }}>
      
      {/* --- Header --- */}
      <header style={headerS}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "2rem" }}>👓</span>
          <div>
            <h1 style={logoS}>KAABI OPTIC PRO</h1>
            <span style={{ fontSize: "0.6rem", opacity: 0.8, letterSpacing: "2px", color: "white" }}>ULTIMATE DASHBOARD</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={navS}>
          <button onClick={() => setActiveTab("dashboard")} style={activeTab === "dashboard" ? tabActive : tabInactive}>
            📊 Dashboard
          </button>
          <button onClick={() => setActiveTab("admin")} style={activeTab === "admin" ? tabActive : tabInactive}>
            🛡️ Admin Activity
          </button>
        </nav>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={exportReport} style={reportBtn}>📥 Rapport</button>
          <button onClick={() => setDarkMode(!darkMode)} style={themeBtn(darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <div style={userBox}>
            <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "white" }}>{session.user.email.split('@')[0]}</div>
            <button onClick={() => supabase.auth.signOut()} style={logoutBtn}>Déconnexion</button>
          </div>
        </div>
      </header>

      <main style={mainS}>
        
        {/* Statistics Grid */}
        <div style={statsGridS}>
          <div style={{ ...cardS(cardBg, textColor), borderBottom: "4px solid #3498db" }}>
            <small>👥 Clients</small>
            <h2 style={{ margin: 0 }}>{stats.totalClients}</h2>
          </div>
          <div style={{ ...cardS(cardBg, textColor), borderBottom: "4px solid #e74c3c" }}>
            <small>💸 Reste à payer</small>
            <h2 style={{ margin: 0, color: "#e74c3c" }}>{stats.totalDettes.toFixed(0)} <small>DT</small></h2>
          </div>
          <div style={{ ...cardS(cardBg, textColor), borderBottom: "4px solid #2ecc71" }}>
            <small>💰 Total Encaissé</small>
            <h2 style={{ margin: 0, color: "#2ecc71" }}>{stats.paidAmount.toFixed(0)} <small>DT</small></h2>
          </div>
          <div style={{ ...cardS(cardBg, textColor), borderBottom: "4px solid #f39c12" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <small>📈 Recouvrement</small>
              <strong>{stats.recoveryRate}%</strong>
            </div>
            <div style={progressBg}><div style={progressFill(stats.recoveryRate)}></div></div>
          </div>
          <div style={{ ...cardS(stats.overdue > 0 ? "#e74c3c" : "#34495e", "white"), border: "none" }}>
            <small>🚨 Retards</small>
            <h2 style={{ margin: 0 }}>{stats.overdue} <small style={{fontSize: "0.8rem"}}>Dossiers</small></h2>
          </div>
        </div>

        <div style={contentGridS}>
          
          {/* Sidebar Tools */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ ...toolBoxS(cardBg, borderColor, textColor) }}>
              <h4 style={toolTitleS}>+ Nouveau Dossier</h4>
              <AddClientForm onClientAdded={handleRefresh} />
            </div>

            <div style={{ ...toolBoxS(cardBg, borderColor, textColor) }}>
              <h4 style={toolTitleS}>📝 Bloc-notes Rapide</h4>
              <textarea value={note} onChange={handleNoteChange} placeholder="Notes..." style={noteAreaS(inputBg, textColor, borderColor)} />
              <small style={{ color: "#27ae60", marginTop: "5px", display: "block" }}>💾 Auto-save</small>
            </div>
          </aside>

          {/* Dynamic Content (Table or Admin Panel) */}
          <section>
            <div style={{ ...tableCardS(cardBg, borderColor, textColor) }}>
              {activeTab === "dashboard" ? (
                <>
                  <div style={tableHeaderS}>
                    <div>
                      <h2 style={{ margin: 0 }}>📂 Base de Données</h2>
                      <p style={{ margin: 0, opacity: 0.6, fontSize: "0.8rem" }}>Suivi en temps réel</p>
                    </div>
                  </div>
                  <ClientHistoryTable key={refreshKey} />
                </>
              ) : (
                <AdminPanel />
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// --- Styles Objects (حسنتهم و برقشتهم) ---
const headerS = { backgroundColor: "#0f172a", color: "white", padding: "10px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", position: "sticky", top: 0, zIndex: 100 };
const logoS = { fontSize: "1.2rem", margin: 0, fontWeight: "900", background: "linear-gradient(90deg, #3498db, #2ecc71)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
const navS = { display: "flex", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "5px", borderRadius: "12px" };
const tabActive = { background: "#3498db", color: "white", border: "none", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", transition: "0.3s" };
const tabInactive = { background: "transparent", color: "#94a3b8", border: "none", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", transition: "0.3s" };
const mainS = { padding: "25px 40px", maxWidth: "1600px", margin: "0 auto" };
const statsGridS = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "25px" };
const cardS = (bg, color) => ({ background: bg, padding: "18px", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.03)", color: color, transition: "0.3s" });
const contentGridS = { display: "grid", gridTemplateColumns: "340px 1fr", gap: "25px" };
const toolBoxS = (bg, border, color) => ({ background: bg, padding: "20px", borderRadius: "18px", border: `1px solid ${border}`, color: color });
const toolTitleS = { margin: "0 0 15px 0", fontSize: "1rem", borderBottom: "2px solid #3498db", display: "inline-block", paddingBottom: "5px" };
const tableCardS = (bg, border, color) => ({ background: bg, padding: "25px", borderRadius: "22px", border: `1px solid ${border}`, color: color, minHeight: "600px" });
const tableHeaderS = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const reportBtn = { background: "#059669", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" };
const themeBtn = (dark) => ({ padding: "8px", borderRadius: "10px", border: "none", cursor: "pointer", background: dark ? "#facc15" : "#334155", color: dark ? "#000" : "#fff" });
const userBox = { borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "15px", textAlign: "right" };
const logoutBtn = { background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.7rem", padding: 0 };
const progressBg = { width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "10px", overflow: "hidden" };
const progressFill = (w) => ({ width: `${w}%`, height: "100%", backgroundColor: w > 50 ? "#22c55e" : "#ef4444", transition: "width 1s" });
const noteAreaS = (bg, color, border) => ({ width: "100%", height: "100px", padding: "10px", borderRadius: "10px", border: `1px solid ${border}`, background: bg, color: color, resize: "none", fontSize: "13px" });
const loadS = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' };