import React from 'react';
import { FiCpu, FiClock, FiCheckCircle, FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';

function parseAIResponse(text) {
  if (!text) return [];
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section headers (lines ending with : or starting with ## or **)
    if (/^#{1,3}\s+/.test(trimmed) || /^\*\*[^*]+\*\*:?$/.test(trimmed) || /^[A-Z][A-Za-z\s&]+:$/.test(trimmed)) {
      if (currentSection) sections.push(currentSection);
      const title = trimmed.replace(/^#{1,3}\s+/, '').replace(/^\*\*|\*\*:?$/g, '').replace(/:$/, '');
      let type = 'info';
      const lower = title.toLowerCase();
      if (lower.includes('warning') || lower.includes('risk') || lower.includes('caution')) type = 'warning';
      else if (lower.includes('recommendation') || lower.includes('success') || lower.includes('optimization') || lower.includes('improve')) type = 'success';
      else if (lower.includes('critical') || lower.includes('anomal') || lower.includes('alert') || lower.includes('error')) type = 'danger';
      currentSection = { title, type, items: [] };
    } else if (currentSection) {
      const item = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
      currentSection.items.push(item);
    } else {
      if (!currentSection) {
        currentSection = { title: 'Analysis', type: 'info', items: [] };
      }
      currentSection.items.push(trimmed.replace(/^[-*]\s+/, ''));
    }
  }
  if (currentSection) sections.push(currentSection);
  if (sections.length === 0) {
    sections.push({ title: 'Analysis Result', type: 'info', items: [text] });
  }
  return sections;
}

function getSectionIcon(type) {
  switch (type) {
    case 'success': return <FiCheckCircle />;
    case 'warning': return <FiAlertTriangle />;
    case 'danger': return <FiAlertCircle />;
    default: return <FiInfo />;
  }
}

export default function AIResultDisplay({ result }) {
  if (!result) return null;

  const responseText = result.result || result.analysis || result.response || (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  const sections = parseAIResponse(responseText);
  const model = result.model || result.aiModel || 'AI Model';
  const timestamp = result.createdAt || result.timestamp || new Date().toISOString();
  const processingTime = result.processingTime || result.duration;

  return (
    <div className="ai-result-container">
      <div className="ai-result-header">
        <div className="model-info">
          <FiCpu style={{ color: 'var(--accent-purple)' }} />
          <span className="model-badge">{model}</span>
          {processingTime && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiClock /> {processingTime}ms
            </span>
          )}
        </div>
        <span className="timestamp">
          {new Date(timestamp).toLocaleString()}
        </span>
      </div>

      {sections.map((section, i) => (
        <div key={i} className={`ai-section ${section.type}`}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getSectionIcon(section.type)}
            {section.title}
          </h3>
          {section.items.length === 1 ? (
            <p>{section.items[0]}</p>
          ) : (
            <ul>
              {section.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
