import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddClientForm({ onClientAdded }) {
  const [form, setForm] = useState({ 
    name: "", 
    phone: "", 
    total_amount: "", 
    cnss_amount: "", 
    advance: "", 
    promise_date: "", 
    note: "" 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. جلب بيانات المستخدم (عمر أو أحمد)
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;

      if (!userEmail) throw new Error("Session expirée. Veuillez vous reconnecter.");

      // 2. إضافة الكليون مع تسجيل "created_by"
      const { data: client, error: clientError } = await supabase.from("client_history_data").insert([{
        client_name: form.name,
        phone: form.phone,
        amount: parseFloat(form.total_amount),
        cnss_amount: parseFloat(form.cnss_amount || 0),
        promise_date: form.promise_date || null,
        note: form.note,
        created_by: userEmail // البصمة متاعك ديما مسجلة
      }]).select().single();

      if (clientError) throw clientError;

      // 3. تسجيل أول دفعة (Avance) إذا وجدت
      if (client && parseFloat(form.advance) > 0) {
        const { error: paymentError } = await supabase.from("payments").insert([{ 
          client_id: client.id, 
          amount_paid: parseFloat(form.advance),
          created_by: userEmail // حتى الدفعة مسجلة باسمك
        }]);
        if (paymentError) throw paymentError;
      }

      // 4. تسجيل العملية في الـ Activity Logs (للمدير)
      await supabase.from("activity_logs").insert([{
        user_email: userEmail,
        action_type: "Ajout Client",
        details: `A ajouté le client ${form.name} avec avance ${form.advance || 0} DT`,
        target_id: client.id
      }]);

      alert(`Dossier de ${form.name} enregistré avec succès ! ✅`);
      
      // تفريغ الفورم
      setForm({ name: "", phone: "", total_amount: "", cnss_amount: "", advance: "", promise_date: "", note: "" });
      
      if (onClientAdded) onClientAdded(); // تحديث الجدول أوتوماتيكياً

    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "10px" }}>
      <h3 style={{ color: "#1a2a3a", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ background: "#3498db", color: "white", padding: "5px 10px", borderRadius: "8px" }}>+</span>
        Nouveau Dossier Client
      </h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input type="text" required placeholder="Nom du Client" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} style={inputS} />
        <input type="tel" required placeholder="Numéro de Téléphone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} style={inputS} />
        <div style={{ display: "flex", gap: "10px" }}>
          <input type="number" required placeholder="Total" value={form.total_amount} onChange={(e) => setForm({...form, total_amount: e.target.value})} style={{...inputS, flex:1}} />
          <input type="number" placeholder="CNSS" value={form.cnss_amount} onChange={(e) => setForm({...form, cnss_amount: e.target.value})} style={{...inputS, flex:1, backgroundColor: "#ebf5fb"}} />
        </div>
        <input type="number" placeholder="Avance (Acompte)" value={form.advance} onChange={(e) => setForm({...form, advance: e.target.value})} style={{...inputS, backgroundColor: "#eafaf1", border: "1px solid #2ecc71"}} />
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "bold" }}>DATE DE PROMESSE</label>
          <input type="date" value={form.promise_date} onChange={(e) => setForm({...form, promise_date: e.target.value})} style={inputS} />
        </div>
        <textarea placeholder="Notes particulières..." value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} style={{...inputS, height: "60px", resize: "none"}} />
        <button type="submit" disabled={loading} style={btnS}>
          {loading ? "Enregistrement..." : "💾 Enregistrer le Dossier"}
        </button>
      </form>
    </div>
  );
}

const inputS = { padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", boxSizing: "border-box", outline: "none", fontSize: "14px" };
const btnS = { padding: "14px", backgroundColor: "#1a2a3a", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", transition: "0.3s" };