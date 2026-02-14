import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ClientManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null); // للـ Modal
  const [paymentHistory, setPaymentHistory] = useState([]);

  // 1. جلب البيانات
  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_history_full").select("*").order("paid_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. جلب تاريخ دفعات حريف معين (Tracing)
  const fetchPaymentDetails = async (client) => {
    setSelectedClient(client);
    const { data } = await supabase
      .from("payments")
      .select("amount_paid, paid_at, method, auth.users(email)")
      .eq("client_id", client.id)
      .order("paid_at", { ascending: false });
    setPaymentHistory(data ?? []);
  };

  // 3. حساب الإحصائيات (Stats)
  const stats = {
    totalDebt: rows.reduce((s, r) => s + r.remaining_client_balance, 0),
    totalCNSS: rows.reduce((s, r) => s + r.cnss_amount, 0),
    activeClients: rows.filter(r => r.remaining_client_balance > 0).length
  };

  return (
    <div style={containerStyle}>
      {/* --- Dashboard Header --- */}
      <div style={statsRow}>
        <div style={statCard}><h3>{stats.totalDebt.toFixed(3)} DT</h3><p>Dettes Clients 💳</p></div>
        <div style={statCard}><h3>{stats.totalCNSS.toFixed(3)} DT</h3><p>Attendu CNSS 🏦</p></div>
        <div style={statCard}><h3>{stats.activeClients}</h3><p>Dossiers Ouverts 📂</p></div>
      </div>

      {/* --- Search & Actions --- */}
      <div style={toolRow}>
        <input 
          style={searchInput} 
          placeholder="🔍 Rechercher par nom ou téléphone..." 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- Table --- */}
      <div style={tableCard}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Client / Tel</th>
              <th style={thStyle}>Reste à Payer</th>
              <th style={thStyle}>Promesse</th>
              <th style={thStyle}>Enregistré par</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter(r => r.client_name.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
              <tr key={row.id} style={trStyle}>
                <td style={tdStyle}>
                  <b>{row.client_name}</b><br/>
                  <small>📞 {row.phone}</small>
                </td>
                <td style={tdStyle}>
                  <b style={{ color: row.remaining_client_balance > 0 ? "#e74c3c" : "#27ae60" }}>
                    {row.remaining_client_balance.toFixed(3)} DT
                  </b>
                </td>
                <td style={tdStyle}>{row.promise_date || "---"}</td>
                <td style={tdStyle}><small>{row.employee_email}</small></td>
                <td style={tdStyle}>
                  <button onClick={() => fetchPaymentDetails(row)} style={btnInfo}>👁️ Détails</button>
                  <a href={`https://wa.me/216${row.phone}`} target="_blank" style={btnWA}>WhatsApp</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Modal Details (History & Tracking) --- */}
      {selectedClient && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Historique de: {selectedClient.client_name}</h3>
            <div style={historyList}>
              {paymentHistory.map((p, i) => (
                <div key={i} style={historyItem}>
                  <span>💰 <b>{p.amount_paid} DT</b></span>
                  <span>📅 {new Date(p.paid_at).toLocaleDateString()}</span>
                  <span>👤 <small>{p.users?.email || "Admin"}</small></span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedClient(null)} style={btnClose}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles (CSS-in-JS) ---
const containerStyle = { padding: "20px", backgroundColor: "#f4f7f6", minHeight: "100vh" };
const statsRow = { display: "flex", gap: "20px", marginBottom: "30px" };
const statCard = { flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", textAlign: "center" };
const toolRow = { marginBottom: "20px" };
const searchInput = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" };
const tableCard = { backgroundColor: "white", borderRadius: "12px", padding: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "15px", borderBottom: "2px solid #eee", color: "#666" };
const tdStyle = { padding: "15px", borderBottom: "1px solid #f9f9f9" };
const trStyle = { transition: "0.2s" };
const btnInfo = { backgroundColor: "#34495e", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", marginRight: "5px" };
const btnWA = { backgroundColor: "#25D366", color: "white", padding: "6px 12px", borderRadius: "4px", textDecoration: "none", fontSize: "13px" };
const modalOverlay = { position: "fixed", top:0, left:0, width:"100%", height:"100%", backgroundColor:"rgba(0,0,0,0.7)", display:"flex", justifyContent:"center", alignItems:"center" };
const modalContent = { backgroundColor:"white", padding:"30px", borderRadius:"15px", width:"400px" };
const historyList = { marginTop: "20px", maxHeight: "300px", overflowY: "auto" };
const historyItem = { display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #eee" };
const btnClose = { marginTop: "20px", width: "100%", padding: "10px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" };