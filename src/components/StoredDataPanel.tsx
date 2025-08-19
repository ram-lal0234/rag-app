'use client';

interface StoredDataItem {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface StoredDataPanelProps {
  items: StoredDataItem[];
  onDeleteItem: (id: string) => void;
}

export default function StoredDataPanel({ items, onDeleteItem }: StoredDataPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden h-full">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Stored RAG Data</h2>
      </div>
      
      <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 70px)' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p>No data stored yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-white">{item.title}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === 'text' ? 'bg-green-100 text-green-800' :
                        item.type === 'file' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'text' ? 'Text' : item.type === 'file' ? 'Document' : 'Website'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 truncate max-w-[150px]">
                        {item.type === 'url' ? item.content : 
                         item.type === 'file' ? item.content : 
                         `${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Delete item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}