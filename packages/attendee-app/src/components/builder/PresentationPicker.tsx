import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from './firebaseConfig';

interface PresentationListItem {
  id: string;
  activityCount: number;
}

interface PresentationPickerProps {
  onSelect: (presentationId: string) => void;
}

export const PresentationPicker: React.FC<PresentationPickerProps> = ({ onSelect }) => {
  const [presentations, setPresentations] = useState<PresentationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    setLoading(true);
    setError(null);

    try {
      const presentationsRef = ref(database, 'presentations');
      const snapshot = await get(presentationsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: PresentationListItem[] = Object.keys(data).map(id => ({
          id,
          activityCount: data[id].config?.activities?.length || 0,
        }));
        // Sort by ID alphabetically
        list.sort((a, b) => a.id.localeCompare(b.id));
        setPresentations(list);
      } else {
        setPresentations([]);
      }
    } catch (err) {
      setError('Failed to load presentations');
      console.error('Error loading presentations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPresentations = presentations.filter(p =>
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading presentations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={loadPresentations} style={styles.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Existing Presentations</h3>

      {presentations.length > 0 && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search presentations..."
          style={styles.searchInput}
        />
      )}

      {filteredPresentations.length === 0 ? (
        <div style={styles.emptyState}>
          {presentations.length === 0
            ? 'No presentations found. Create your first one!'
            : 'No matching presentations'}
        </div>
      ) : (
        <div style={styles.list}>
          {filteredPresentations.map(presentation => (
            <div
              key={presentation.id}
              onClick={() => onSelect(presentation.id)}
              style={styles.listItem}
            >
              <span style={styles.presentationId}>{presentation.id}</span>
              <span style={styles.activityCount}>
                {presentation.activityCount} {presentation.activityCount === 1 ? 'activity' : 'activities'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '12px',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  retryBtn: {
    display: 'block',
    margin: '0 auto',
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px',
  },
  list: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
  },
  presentationId: {
    fontWeight: '500',
    color: '#333',
  },
  activityCount: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#e5e7eb',
    padding: '4px 8px',
    borderRadius: '12px',
  },
};
