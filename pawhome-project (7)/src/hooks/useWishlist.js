import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function useWishlist() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistPets, setWishlistPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for current user's wishlist IDs
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      setWishlistPets([]);
      setLoading(false);
      return;
    }

    const wishlistColRef = collection(db, 'wishlists', user.uid, 'pets');
    const unsubscribe = onSnapshot(
      wishlistColRef,
      (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id));
        setWishlistIds(ids);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching wishlist:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Fetch full pet objects for wishlisted IDs when viewing My Account Wishlist
  const fetchWishlistPets = useCallback(async () => {
    if (!user || wishlistIds.size === 0) {
      setWishlistPets([]);
      return;
    }

    try {
      setLoading(true);
      const petsCol = collection(db, 'pets');
      const allPetsSnap = await getDocs(petsCol);
      const list = allPetsSnap.docs
        .filter((d) => wishlistIds.has(d.id))
        .map((d) => ({ id: d.id, ...d.data() }));
      setWishlistPets(list);
    } catch (err) {
      console.error('Error fetching wishlist pet details:', err);
    } finally {
      setLoading(false);
    }
  }, [user, wishlistIds]);

  const toggleWishlist = async (petId, petName = 'Pet') => {
    if (!user) {
      showToast('Log in to save pets to your wishlist');
      return false;
    }

    const petRef = doc(db, 'wishlists', user.uid, 'pets', String(petId));
    const isCurrentlyLiked = wishlistIds.has(String(petId));

    try {
      if (isCurrentlyLiked) {
        await deleteDoc(petRef);
        showToast(`Removed ${petName} from wishlist`);
      } else {
        await setDoc(petRef, {
          addedAt: serverTimestamp()
        });
        showToast(`Added ${petName} to wishlist`);
      }
      return true;
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      showToast('Could not update wishlist. Please try again.');
      return false;
    }
  };

  const isWishlisted = (petId) => {
    return wishlistIds.has(String(petId));
  };

  return {
    wishlistIds,
    wishlistPets,
    loading,
    toggleWishlist,
    isWishlisted,
    fetchWishlistPets
  };
}
