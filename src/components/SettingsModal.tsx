'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// User settings interface
interface UserSettings {
  apiKey: string;
  model: string;
}

// Available OpenAI models
const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable model' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast and cost-effective' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'High performance' },
  { value: 'gpt-4', label: 'GPT-4', description: 'Original GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
];

// Local storage helpers - unified approach
const getSettingsStorageKey = (userId: string) => `user-settings-${userId}`;

const saveSettingsToStorage = (userId: string, settings: UserSettings) => {
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

const loadSettingsFromStorage = (userId: string): UserSettings => {
  try {
    const key = getSettingsStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        apiKey: parsed.apiKey || '',
        model: parsed.model || 'gpt-4o-mini'
      };
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  
  // Return default settings
  return {
    apiKey: '',
    model: 'gpt-4o-mini'
  };
};

const removeSettingsFromStorage = (userId: string) => {
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove settings from localStorage:', error);
  }
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useUser();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings when modal opens or user changes
  useEffect(() => {
    if (isOpen && user?.id) {
      const settings = loadSettingsFromStorage(user.id);
      setApiKey(settings.apiKey);
      setSelectedModel(settings.model);
    }
  }, [isOpen, user?.id]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSave = () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }

    // API key is now optional - validate format only if provided
    if (apiKey.trim() && (!apiKey.startsWith('sk-') || apiKey.length < 20)) {
      setMessage({ type: 'error', text: 'Invalid API key format. OpenAI keys start with "sk-"' });
      return;
    }

    setIsSaving(true);
    try {
      const settings: UserSettings = {
        apiKey: apiKey.trim(), // Can be empty - will fall back to environment variable
        model: selectedModel
      };
      saveSettingsToStorage(user.id, settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    if (!user?.id) return;

    const confirmRemove = window.confirm('Are you sure you want to remove your settings?');
    if (!confirmRemove) return;

    try {
      removeSettingsFromStorage(user.id);
      setApiKey('');
      setSelectedModel('gpt-4o-mini');
      setMessage({ type: 'success', text: 'Settings removed successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove settings' });
    }
  };

  const handleClose = () => {
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* OpenAI API Key Section */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
              OpenAI API Key <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-... (optional - will use environment key if not provided)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2 text-gray-400 hover:text-white"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 000 4.243m4.242-4.243L15.536 15.536M15.536 15.536L19.07 19.07" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Optional: Your API key is stored locally. If not provided, the app will use the configured environment API key.{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Get your API key here
              </a>
            </p>
          </div>

          {/* Model Selection Section */}
          <div>
            <label htmlFor="modelSelect" className="block text-sm font-medium mb-2">
              OpenAI Model
            </label>
            <select
              id="modelSelect"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {OPENAI_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {OPENAI_MODELS.find(m => m.value === selectedModel)?.description}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>Performance:</strong> GPT-4o &gt; GPT-4 Turbo &gt; GPT-4 &gt; GPT-4o Mini &gt; GPT-3.5 Turbo</p>
              <p><strong>Cost:</strong> GPT-3.5 Turbo &lt; GPT-4o Mini &lt; GPT-4o &lt; GPT-4 &lt; GPT-4 Turbo</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-900 text-green-200 border border-green-700' 
                : 'bg-red-900 text-red-200 border border-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            {apiKey && (
              <button
                onClick={handleRemove}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export unified helper functions for other components
export const getUserSettings = (userId: string): UserSettings => {
  return loadSettingsFromStorage(userId);
};

// Backward compatibility functions
export const getUserApiKey = (userId: string): string => {
  return getUserSettings(userId).apiKey;
};

export const getUserModel = (userId: string): string => {
  return getUserSettings(userId).model;
};

// Export the UserSettings type for other components
export type { UserSettings }; 