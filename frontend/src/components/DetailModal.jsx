import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiTrash2, FiSave } from 'react-icons/fi';

export default function DetailModal({ isOpen, item, fields, onClose, onSave, onDelete, title }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(item._id || item.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const renderValue = (field, value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (field.type === 'status') {
      const statusClass = value === 'active' ? 'badge-green' : value === 'inactive' ? 'badge-red' : 'badge-yellow';
      return <span className={`badge ${statusClass}`}>{value}</span>;
    }
    return String(value);
  };

  const renderInput = (field) => {
    const val = formData[field.key] ?? '';
    if (field.type === 'select') {
      return (
        <select
          className="form-control"
          value={val}
          onChange={(e) => handleChange(field.key, e.target.value)}
        >
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return (
        <textarea
          className="form-control"
          value={val}
          onChange={(e) => handleChange(field.key, e.target.value)}
        />
      );
    }
    if (field.type === 'number') {
      return (
        <input
          type="number"
          className="form-control"
          value={val}
          onChange={(e) => handleChange(field.key, e.target.value)}
        />
      );
    }
    return (
      <input
        type="text"
        className="form-control"
        value={val}
        onChange={(e) => handleChange(field.key, e.target.value)}
      />
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title || 'Details'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          {editing ? (
            <div>
              {fields.filter(f => !f.readOnly).map((field) => (
                <div key={field.key} className="form-group">
                  <label>{field.label}</label>
                  {renderInput(field)}
                </div>
              ))}
            </div>
          ) : (
            <div className="detail-grid">
              {fields.map((field) => (
                <div key={field.key} className="detail-item">
                  <div className="detail-label">{field.label}</div>
                  <div className="detail-value">{renderValue(field, item[field.key])}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><FiSave /> Save</button>
            </>
          ) : (
            <>
              {confirmDelete ? (
                <>
                  <span style={{ color: 'var(--accent-red)', fontSize: '14px', marginRight: 'auto' }}>
                    Confirm delete?
                  </span>
                  <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button>
                </>
              ) : (
                <>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}><FiTrash2 /> Delete</button>
                  <button className="btn btn-primary" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
