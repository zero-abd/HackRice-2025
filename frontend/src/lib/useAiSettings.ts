import { useEffect, useState } from 'react';
import { getAiSettings, type AiSettings } from '../services/ai';

/** Current AI settings, kept in sync across components. */
export function useAiSettings(): AiSettings {
  const [settings, setSettings] = useState<AiSettings>(() => getAiSettings());
  useEffect(() => {
    const refresh = () => setSettings(getAiSettings());
    window.addEventListener('docless-ai-settings', refresh);
    return () => window.removeEventListener('docless-ai-settings', refresh);
  }, []);
  return settings;
}
