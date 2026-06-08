import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useERPSync(callback: () => void) {
  const { user, loading, isAdmin } = useAuth();
  const callbackRef = useRef(callback);

  // Keep callbackRef up to date with the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Only subscribe to ERP Sync when the user has finished loading, is authenticated, and is an Admin
    if (loading || !user || !isAdmin) {
      return;
    }

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
  }, [loading, user, isAdmin]); // Re-subscribe when auth states change
}
