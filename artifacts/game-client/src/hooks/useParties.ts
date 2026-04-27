import { useState, useCallback } from "react";

export interface Party {
  id: string;
  name: string;
  unitIds: string[];
}

const STORAGE_KEY = "tower-seekers-parties";

function loadFromStorage(): Party[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Party[];
  } catch {
    return [];
  }
}

function persist(parties: Party[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parties));
}

export function useParties() {
  const [parties, setParties] = useState<Party[]>(loadFromStorage);

  const saveParty = useCallback((name: string, unitIds: string[], editId?: string) => {
    setParties((prev) => {
      let updated: Party[];
      if (editId) {
        updated = prev.map((p) =>
          p.id === editId
            ? { ...p, name: name.trim() || "Unnamed Party", unitIds }
            : p
        );
      } else {
        updated = [
          ...prev,
          { id: `party-${Date.now()}`, name: name.trim() || "Unnamed Party", unitIds },
        ];
      }
      persist(updated);
      return updated;
    });
  }, []);

  const deleteParty = useCallback((id: string) => {
    setParties((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  return { parties, saveParty, deleteParty };
}
