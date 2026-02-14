import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ArchiveTable() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true); // 1. Loading state

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_history")
      .select("id, client_name, amount, paid_at, method, note, recorded_by_name")
      .eq("archived", true)
      .order("paid_at", { ascending: false });
    
    if (!error) setRows(data || []);
    setLoading(false);
  }

  async function handleRestore(id) {
    const { error } = await supabase.from("client_history").update({ archived: false }).eq("id", id);
    if (!error) {
      setRows(rows.filter(r => r.id !== id));
    }
  }

  async function handleDelete(id) {
    // 2. Confirmation قبل الفسخان
    const confirmDelete = window.confirm("Are you sure you want to PERMANENTLY delete this record?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("client_history").delete().eq("id", id);
    if (!error) {
      setRows(rows.filter(r => r.id !== id));
    }
  }

  // 3. فلترة البيانات قبل العرض والحساب
  const filteredRows = rows.filter((r) =>
    r.client_name.toLowerCase().includes(search.toLowerCase())
  );

  // 4. حساب المجموع للبيانات المفلترة فقط
  const filteredTotal = filteredRows.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="archive-container" style={{ marginTop: 30, padding: '15px', border: '1px solid #ddd' }}>
      <h2>📦 Archived Records</h2>
      
      <div style={{ marginBottom: 15, display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search archived clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px', flex: 1 }}
        />
        <button onClick={() => {/* logic للـ CSV */}}>Export CSV</button>
      </div>

      {loading ? (
        <p>Loading archive...</p>
      ) : (
        <table width="100%" border="1" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th>Client</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.client_name}</td>
                  <td>{r.amount} TND</td>
                  <td>{new Date(r.paid_at).toLocaleDateString()}</td>
                  <td>{r.method}</td>
                  <td>
                    <button onClick={() => handleRestore(r.id)} style={{ color: 'green' }}>Restore</button>
                    <button onClick={() => handleDelete(r.id)} style={{ color: 'red', marginLeft: 10 }}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No records found.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f9f9f9' }}>
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", padding: '10px' }}>
                Filtered Total:
              </td>
              <td style={{ fontWeight: "bold", color: 'blue' }}>{filteredTotal} TND</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}