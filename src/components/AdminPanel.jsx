import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminPanel() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalAdded: 0, totalPaid: 0 });

  const fetchLogs = async () => {
    // جلب آخر 20 حركة صارت في السيستم
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (!error) setLogs(data);
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div style={adminContainer}>
      <h2 style={{ color: "#1a2a3a", marginBottom: "20px" }}>🛡️ Admin Monitor Control</h2>
      
      {/* Cards الإحصائيات الذكية */}
      <div style={statsGrid}>
        <div style={{ ...statCard, borderLeft: "5px solid #3498db" }}>
          <h4>Actions Aujourd'hui</h4>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>{logs.length}</p>
        </div>
        <div style={{ ...statCard, borderLeft: "5px solid #f1c40f" }}>
          <h4>Dernier Agent Actif</h4>
          <p style={{ fontSize: "18px", color: "#2c3e50" }}>{logs[0]?.user_email || "---"}</p>
        </div>
      </div>

      {/* Timeline التحركات */}
      <div style={timelineContainer}>
        <h3 style={{ fontSize: "1rem", marginBottom: "15px", color: "#7f8c8d" }}>Historique en temps réel</h3>
        
        {logs.map((log) => (
          <div key={log.id} style={logItem}>
            <div style={timeBadge}>{new Date(log.created_at).toLocaleTimeString()}</div>
            <div style={logText}>
              <span style={userLabel}>{log.user_email?.split('@')[0]}</span> 
              <span style={actionLabel(log.action_type)}>{log.action_type}</span>
              <p style={detailsText}>{log.details}</p>
            </div>
          </div>
        ))}
        
        {logs.length === 0 && <p style={{textAlign: 'center', color: '#999'}}>Aucune activité enregistrée.</p>}
      </div>
    </div>
  );
}

// --- Styles Pro ---
const adminContainer = { padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "20px", minHeight: "400px" };
const statsGrid = { display: "flex", gap: "20px", marginBottom: "30px" };
const statCard = { flex: 1, backgroundColor: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" };
const timelineContainer = { backgroundColor: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" };
const logItem = { display: "flex", gap: "20px", padding: "15px 0", borderBottom: "1px solid #f1f1f1", alignItems: "center" };
const timeBadge = { backgroundColor: "#1a2a3a", color: "white", padding: "5px 10px", borderRadius: "8px", fontSize: "12px", minWidth: "70px", textAlign: "center" };
const logText = { flex: 1 };
const userLabel = { fontWeight: "bold", color: "#2c3e50", marginRight: "10px", textTransform: "capitalize" };
const detailsText = { margin: "5px 0 0 0", fontSize: "13px", color: "#7f8c8d" };

const actionLabel = (type) => ({
  fontSize: "11px",
  padding: "3px 8px",
  borderRadius: "5px",
  fontWeight: "bold",
  backgroundColor: type.includes("Ajout") ? "#eafaf1" : "#ebf5fb",
  color: type.includes("Ajout") ? "#27ae60" : "#3498db"
});