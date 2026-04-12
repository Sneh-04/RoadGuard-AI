import { X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`toast ${type}`}>
      <div>{message}</div>
      <button type="button" onClick={onClose} aria-label="Close notification"><X size={16} /></button>
    </div>
  );
}
