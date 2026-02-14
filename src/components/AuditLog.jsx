// زيد هذي في الـ CSS متاعك باش تظهر الـ Badges
// .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
// .audit-insert { background: #d4edda; color: #155724; }
// .audit-delete { background: #f8d7da; color: #721c24; }

export default function AuditLog() {
  // ... نفس الـ state ...

  return (
    <div style={{ marginTop: 30, padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        📋 Audit Log <span style={{ fontSize: '14px', color: '#7f8c8d' }}>(System Events)</span>
      </h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <input 
          type="text" 
          placeholder="Search by user or action..." 
          style={{ padding: '8px', width: '300px', borderRadius: '5px', border: '1px solid #ddd' }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={exportCSV} className="export-btn">📥 Export Report</button>
      </div>

      <table width="100%" style={{ textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px' }}>Action</th>
            <th>User</th>
            <th>Target Record</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs
            .filter(l => l.action.includes(search) || l.user_name?.includes(search))
            .map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <span className={`badge ${getActionClass(log.action)}`}>
                    {log.action.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontWeight: '500' }}>{log.user_name || "System"}</td>
                <td style={{ color: '#666', fontSize: '13px' }}>
                   {log.table_name} (ID: {log.record_id.substring(0, 8)}...)
                </td>
                <td style={{ color: '#999' }}>
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      
      {/* ⚠️ ناقص هنا: زر Load More */}
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button style={{ background: 'none', border: '1px solid #ccc', cursor: 'pointer' }}>Show Older Logs</button>
      </div>
    </div>
  );
}