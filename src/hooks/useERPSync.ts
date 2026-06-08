import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useERPSync(callback: () => void) {
  const callbackRef = useRef(callback);

  // Keep callbackRef up to date with the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Listen to changes on the main backup document
    const unsub = onSnapshot(doc(db, "backups", "current"), (docSnap) => {
      // Whenever another user modifies ERP data, the cloud backup updates immediately
      // This will trigger a re-fetch of the APIs to ensure our local view is perfectly in sync
      if (docSnap.exists()) {
        callbackRef.current();
      }
    }, (error) => {
      console.warn("ERP Sync error (ignored):", error);
    });

    return () => unsub();
  }, []); // Empty dependency array means this listener is established exactly once on mount
}
