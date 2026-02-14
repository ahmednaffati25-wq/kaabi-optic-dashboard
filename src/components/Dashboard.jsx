import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard({ refresh }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      const { data, error } = await supabase.from("client_credit_summary").select("*");
      if (!error) setData(data);
      setLoading(false);
    }
    fetchSummary();
  }, [refresh]);

  const totals = data.reduce((acc, curr) => ({
    total: acc.total + curr.montant_total,
    paid: acc.paid + curr.total_paid,
    remaining: acc.remaining + curr.remaining_balance
  }), { total: 0, paid: 0, remaining: 0 });

  const chartData = [
    { name: "Paid", value: totals.paid },
    { name: "Remaining", value: totals.remaining }
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: '4px solid #22c55e' }}>
          <p>Total Paid (الخلاص)</p>
          <h3>{totals.paid.toFixed(3)} TND</h3>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #ef4444' }}>
          <p>Total Remaining (الكريدي)</p>
          <h3>{totals.remaining.toFixed(3)} TND</h3>
        </div>
      </div>

      <div className="chart-container" style={{ marginTop: '20px', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} innerRadius={60} outerRadius={80} dataKey="value" label>
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}