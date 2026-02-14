import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // هذا هو المفتاح للتبديل
  const [msg, setMsg] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (isSignUp) {
        // --- إنشاء حساب جديد ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMsg("✅ Compte créé avec succès ! Vous pouvez vous connecter.");
        setIsSignUp(false); // نرجعه لصفحة الدخول أوتوماتيكياً
      } else {
        // --- تسجيل الدخول ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setMsg(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>👓</div>
        <h2 style={styles.title}>KAABI OPTIC PRO</h2>
        <p style={styles.subtitle}>
          {isSignUp ? "Création d'un nouveau compte admin" : "Accès sécurisé au système"}
        </p>

        <form onSubmit={handleAuth} style={styles.form}>
          <input
            type="email"
            placeholder="Email (ex: admin@kaabi.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Chargement..." : (isSignUp ? "S'inscrire" : "Se Connecter")}
          </button>
        </form>

        {msg && <div style={styles.msg}>{msg}</div>}

        <div style={styles.footer}>
          <span style={{ opacity: 0.7 }}>
            {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}
          </span>
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMsg(""); }} 
            style={styles.linkBtn}
          >
            {isSignUp ? "Se connecter" : "Créer un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Styles (Inline باش ما تصيرش مشاكل) ---
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a2a3a",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  logo: { fontSize: "3rem", marginBottom: "10px" },
  title: { margin: "0 0 10px 0", color: "#1a2a3a" },
  subtitle: { margin: "0 0 30px 0", color: "#7f8c8d", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: {
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
    backgroundColor: "#f9f9f9",
  },
  button: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#3498db",
    color: "white",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },
  msg: { marginTop: "15px", padding: "10px", borderRadius: "8px", backgroundColor: "#f0f2f5", fontSize: "0.9rem" },
  footer: { marginTop: "20px", fontSize: "0.9rem", display: "flex", justifyContent: "center", gap: "5px" },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#3498db",
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "underline",
  }
};