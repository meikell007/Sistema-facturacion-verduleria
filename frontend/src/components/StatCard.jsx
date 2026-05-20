import React from 'react';

export default function StatCard({ title, value, icon: Icon, colorClass = '', subtitle = '' }) {
  return (
    <div className="card stat-card">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="stat-label">{title}</span>
        <h3 className="stat-value">{value}</h3>
        {subtitle && (
          <span 
            className="stat-label" 
            style={{ 
              fontSize: '0.75rem', 
              marginTop: '4px', 
              display: 'block',
              color: 'var(--text-muted)'
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div className={`stat-icon ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
