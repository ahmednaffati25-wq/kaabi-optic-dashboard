import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function HistoryModal({ record, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...record });

  // تصحيح الحساب: أي طريقة دفع تعني المبلغ مدفوع بالكامل
  const total = record.amount;
  const isPaid = record.method !== "credit"; // لو عندك حالة اسمها credit
  const remaining = isPaid ? 0 : total;

  async function handleAction(type) {
    let error;
    if (type === "delete") {
      if (!window.confirm("🚨 Are you sure? This cannot be undone!")) return;
      const res = await supabase.from("client_history_full").delete().eq("id", record.id);
      error = res.error;
    } else {
      const res = await supabase.from("client_history_full")
        .update({ archived: type === "archive" })
        .eq("id", record.id);
      error = res.error;
    }

    if (!error) {
      alert(`Record ${type}d!`);
      onUpdate(); // باش يتنحى السطر مالجدول وراء الـ Modal
      onClose();
    }
  }

  async function saveChanges() {
    const { error } = await supabase.from("client_history_full")
      .update({
        client_name: editedData.client_name,
        amount: editedData.amount,
        note: editedData.note,
        cnss: editedData.cnss
      })
      .eq("id", record.id);

    if (!error) {
      alert("Updated successfully!");
      setIsEditing(false);
      onUpdate();
    }
  }

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{isEditing ? "Edit Details" : `Details: ${record.client_name}`}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
        </div>
        <hr />

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={editedData.client_name} onChange={e => setEditedData({...editedData, client_name: e.target.value})} />
            <input type="number" value={editedData.amount} onChange={e => setEditedData({...editedData, amount: e.target.value})} />
            <textarea value={editedData.note} onChange={e => setEditedData({...editedData, note: e.target.value})} />
            <button onClick={saveChanges} style={{ backgroundColor: '#2ecc71', color: 'white' }}>Save Changes</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <p><strong>Status:</strong> {record.archived ? "📁 Archived" : "🟢 Active"}</p>
            <p><strong>Amount:</strong> {record.amount.toFixed(3)} TND</p>
            <p><strong>Method:</strong> <span className="badge">{record.method}</span></p>
            <p><strong>Note:</strong> {record.note || "---"}</p>
            <p><strong>CNSS:</strong> {record.cnss || "---"}</p>
            <p style={{ color: remaining > 0 ? 'red' : 'green' }}>
              <strong>Remaining:</strong> {remaining.toFixed(3)} TND
            </p>

            <div style={buttonGroupStyle}>
              <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
              {record.archived ? 
                <button onClick={() => handleAction("restore")}>⏪ Restore</button> : 
                <button onClick={() => handleAction("archive")}>📥 Archive</button>
              }
              <button onClick={() => handleAction("delete")} style={{ backgroundColor: "#e74c3c", color: 'white' }}>🗑️ Delete</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Styles بسيطة للـ Modal
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const contentStyle = { background: 'white', padding: '25px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const buttonGroupStyle = { marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' };