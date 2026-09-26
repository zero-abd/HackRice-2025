import React, { useEffect, useState } from 'react';
import { KeyRound, Check, ExternalLink } from 'lucide-react';
import {
  PROVIDERS,
  REPO_URL,
  OLLAMA_DEFAULT_URL,
  forgetKey,
  getSettingsFor,
  isAiReady,
  providerInfo,
  saveAiSettings,
  type AiSettings,
  type ProviderId,
} from '../services/ai';
import { useAiSettings } from '../lib/useAiSettings';

interface Props {
  compact?: boolean;
  onSaved?: () => void;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

const AiSettingsPanel: React.FC<Props> = ({ compact, onSaved }) => {
  const current = useAiSettings();
  const [draft, setDraft] = useState<AiSettings>(current);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(current), [current]);

  const info = providerInfo(draft.provider);

  const changeProvider = (provider: ProviderId) => {
    setDraft(getSettingsFor(provider));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAiSettings(draft);
    setSaved(true);
    onSaved?.();
  };

  const ready = isAiReady(current);

  return (
    <form onSubmit={handleSave} className={compact ? 'space-y-3' : 'space-y-4'}>
      {!compact && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block w-2 h-2 rounded-full ${ready ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className="text-gray-700">
            {ready ? `Ready: ${providerInfo(current.provider).label}, model ${current.model}` : 'No AI key set for this tab yet'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
          <select
            id="ai-provider"
            value={draft.provider}
            onChange={(e) => changeProvider(e.target.value as ProviderId)}
            className={inputClass}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <input
            id="ai-model"
            value={draft.model}
            onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setSaved(false); }}
            placeholder={info.defaultModel}
            className={inputClass}
          />
        </div>
      </div>

      {info.needsKey ? (
        <div>
          <label htmlFor="ai-key" className="block text-sm font-medium text-gray-700 mb-1">
            {info.label} API key
          </label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="ai-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft.apiKey}
              onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setSaved(false); }}
              placeholder={info.keyHint}
              className={`${inputClass} pl-9`}
            />
          </div>
          {info.keyUrl && (
            <a href={info.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
              Get a key <ExternalLink size={12} />
            </a>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="ai-ollama" className="block text-sm font-medium text-gray-700 mb-1">Ollama URL</label>
          <input
            id="ai-ollama"
            value={draft.ollamaUrl}
            onChange={(e) => { setDraft({ ...draft, ollamaUrl: e.target.value }); setSaved(false); }}
            placeholder={OLLAMA_DEFAULT_URL}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Runs the model on your own machine, as in the original HackRice build. Start Ollama with{' '}
            <code className="bg-gray-100 px-1 rounded">OLLAMA_ORIGINS={window.location.origin} ollama serve</code> and pull the model first.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-600 bg-blue-50/70 border border-blue-100 rounded-lg p-3">
        Your key stays in your browser and is sent only with your own requests. Nothing is saved. This project is open
        source, so you can check the code:{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-blue-700 underline">{REPO_URL.replace('https://', '')}</a>
      </p>

      <div className="flex items-center gap-3">
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          Use these settings
        </button>
        {info.needsKey && current.apiKey && current.provider === draft.provider && (
          <button
            type="button"
            onClick={() => forgetKey(draft.provider)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Forget key
          </button>
        )}
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-green-700">
            <Check size={16} /> Saved for this tab
          </span>
        )}
      </div>
    </form>
  );
};

export default AiSettingsPanel;
