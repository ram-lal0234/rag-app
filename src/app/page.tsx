"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import DataIngestionPanel from "../components/DataIngestionPanel";
import StoredDataPanel from "../components/StoredDataPanel";
import ChatPanel from "../components/ChatPanel";

interface StoredDataItem {
  id: string;
  type: string;
  title: string;
  content: string;
}

export default function Home() {
  const [storedData, setStoredData] = useState<StoredDataItem[]>([]);

  const handleDataIngested = (data: {
    type: string;
    content: string;
    title: string;
  }) => {
    const newItem: StoredDataItem = {
      id: uuidv4(),
      ...data,
    };
    setStoredData((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setStoredData((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
          <DataIngestionPanel onDataIngested={handleDataIngested} />
          <StoredDataPanel items={storedData} onDeleteItem={handleDeleteItem} />
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
