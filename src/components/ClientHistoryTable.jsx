import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ClientHistoryTable() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [showOnlyDebt, setShowOnlyDebt] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // States متاع الـ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase.from("client_history_full").select("*");
    if (!error) setRows(data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const showInfo = (client) => {
    const dateCreation = new Date(client.created_at).toLocaleDateString('fr-FR');
    alert(`
      📄 FICHE DOSSIER : ${client.client_name}
      --------------------------------------------
      👤 Enregistré par : ${client.created_by || 'Système'} 
      📅 Date de création : ${dateCreation}
      
      🛠️ Dernière modification : ${client.last_modified_by || 'Aucune'}
      📱 Téléphone : ${client.phone || '---'}
      
      💰 Détails Financiers :
      - Total Dossier : ${client.total_client_amount} DT
      - CNSS : ${client.cnss_amount || 0} DT
      - Avances payées : ${client.total_paid} DT
      - RESTE À PAYER : ${client.remaining_client_balance.toFixed(3)} DT
      
      📝 Note : ${client.note || 'Pas de remarques.'}
      --------------------------------------------
    `);
  };

  const openPayModal = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    setPaymentAmount("");
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      const { error: payError } = await supabase.from("payments").insert([{
        client_id: selectedClient.id,
        amount_paid: parseFloat(paymentAmount),
        created_by: userEmail
      }]);
      if (payError) throw payError;
      await supabase.from("client_history_data").update({ last_modified_by: userEmail }).eq('id', selectedClient.id);
      await supabase.from("activity_logs").insert([{
        user_email: userEmail,
        action_type: "Paiement",
        details: `A encaissé ${paymentAmount} DT pour ${selectedClient.client_name}`,
        target_id: selectedClient.id
      }]);
      setIsModalOpen(false);
      fetchData();
      alert(`Paiement de ${paymentAmount} DT enregistré ! ✅`);
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- المنطق متاع الفلترة والترقيم ---
  const filteredRows = rows.filter(r => {
    const matchesSearch = r.client_name.toLowerCase().includes(search.toLowerCase()) || (r.phone && r.phone.includes(search));
    const matchesDebt = showOnlyDebt ? r.remaining_client_balance > 0.001 : true;
    return matchesSearch && matchesDebt;
  });

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const currentItems = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ width: "100%" }}>
      <div style={controlsRow}>
        <input 
            placeholder="🔍 Rechercher un client..." 
            style={searchBar} 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
        />
        <button 
            onClick={() => { setShowOnlyDebt(!showOnlyDebt); setCurrentPage(1); }} 
            style={showOnlyDebt ? btnFilterActive : btnFilter}
        >
          {showOnlyDebt ? "⚠️ Dette Uniquement" : "📂 Tous les dossiers"}
        </button>
      </div>

      <div style={tableContainer}>
        <table style={tableS}>
          <thead>
            <tr style={thRow}>
              <th style={pad}>CLIENT / AGENT</th>
              <th style={pad}>RESTE</th>
              <th style={pad}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row) => (
              <tr key={row.id} style={trS}>
                <td style={pad}>
                  <div style={{ fontWeight: "700" }}>{row.client_name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>👤 {row.created_by?.split('@')[0]}</div>
                </td>
                <td style={pad}>
                  <span style={row.remaining_client_balance > 0.001 ? debtBadge : clearBadge}>
                    {row.remaining_client_balance.toFixed(3)} DT
                  </span>
                </td>
                <td style={{ ...pad, display: "flex", gap: "5px" }}>
                  <button onClick={() => openPayModal(row)} style={btnP}>💰 Pay</button>
                  <button onClick={() => showInfo(row)} style={btnI}>ℹ️ Info</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- التحكم في الصفحات (Pagination) --- */}
      <div style={paginationContainer}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={currentPage === 1 ? btnNavDisabled : btnNav}>
          Précédent
        </button>
        <span style={{ fontSize: "14px", color: "#64748b" }}>Page <b>{currentPage}</b> sur {totalPages || 1}</span>
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} style={(currentPage === totalPages || totalPages === 0) ? btnNavDisabled : btnNav}>
          Suivant
        </button>
      </div>

      {/* MODAL Paiement */}
      {isModalOpen && (
        <div style={overlayS}>
          <div style={modalS}>
            <div style={{ textAlign: "right" }}>
              <button onClick={() => setIsModalOpen(false)} style={closeX}>✕</button>
            </div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "3rem" }}>💸</span>
              <h3 style={{ margin: "10px 0" }}>Encaisser Paiement</h3>
              <p style={{ color: "#64748b" }}>Client: <b>{selectedClient?.client_name}</b></p>
            </div>
            <input autoFocus type="number" placeholder="0.000" style={modalInput} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            <button onClick={handlePaymentSubmit} disabled={isSubmitting} style={confirmBtn}>
              {isSubmitting ? "Enregistrement..." : "Confirmer"}
            </button>
            <button onClick={() => setIsModalOpen(false)} style={cancelBtn}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const controlsRow = { marginBottom: "15px", display: "flex", gap: "10px" };
const searchBar = { flex: 2, padding: "12px", borderRadius: "10px", border: "1px solid #ddd", outline: "none" };
const btnFilter = { flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer", fontSize: "12px", fontWeight: "bold", color: "#64748b" };
const btnFilterActive = { ...btnFilter, backgroundColor: "#fff1f2", color: "#e11d48", border: "1px solid #e11d48" };

const tableContainer = { background: "white", borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
const tableS = { width: "100%", borderCollapse: "collapse" };
const thRow = { background: "#f8fafc", textAlign: "left" };
const trS = { borderBottom: "1px solid #f1f5f9" };
const pad = { padding: "15px" };

const paginationContainer = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "0 10px" };
const btnNav = { padding: "8px 15px", borderRadius: "8px", border: "none", backgroundColor: "#1a2a3a", color: "white", cursor: "pointer", fontWeight: "bold" };
const btnNavDisabled = { ...btnNav, backgroundColor: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed" };

const debtBadge = { color: "#e11d48", fontWeight: "bold", background: "#fff1f2", padding: "5px 10px", borderRadius: "6px" };
const clearBadge = { color: "#059669", fontWeight: "bold", background: "#f0fdf4", padding: "5px 10px", borderRadius: "6px" };
const btnP = { backgroundColor: "#1a2a3a", color: "white", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const btnI = { backgroundColor: "#e2e8f0", color: "#475569", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };

const overlayS = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" };
const modalS = { backgroundColor: "white", padding: "30px", borderRadius: "20px", width: "100%", maxWidth: "400px" };
const closeX = { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" };
const modalInput = { width: "100%", padding: "15px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "1.2rem", fontWeight: "bold", textAlign: "center", marginBottom: "15px", boxSizing: "border-box" };
const confirmBtn = { width: "100%", padding: "15px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "12px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", marginBottom: "10px" };
const cancelBtn = { width: "100%", background: "none", border: "none", color: "#64748b", cursor: "pointer" };