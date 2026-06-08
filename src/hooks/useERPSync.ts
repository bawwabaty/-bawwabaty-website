import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useERPSync(callback: () => void) {
  useEffect(() => {
    // Listen to changes on the main backup document
    const unsub = onSnapshot(doc(db, "backups", "current"), (docSnap) => {
      // Whenever another user modifies ERP data, the cloud backup updates immediately
      // This will trigger a re-fetch of the APIs to ensure our local view is perfectly in sync
      if (docSnap.exists()) {
        callback();
      }
    }, (error) => {
      console.warn("ERP Sync error (ignored):", error);
    });

    return () => unsub();
  }, [callback]);
}
