import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function usePets(filters = {}, pageSize = 9) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [error, setError] = useState(null);

  const fetchPets = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const petsRef = collection(db, 'pets');
      let constraints = [];

      // Only show Available pets for public listing unless explicitly requested
      if (!filters.includeAllStatuses) {
        constraints.push(where('status', '==', 'Available'));
      }

      // Country filter
      if (filters.country && filters.country !== 'all') {
        if (filters.country === 'in') {
          constraints.push(where('country', '==', 'India'));
        } else if (filters.country === 'intl') {
          constraints.push(where('country', '!=', 'India'));
        } else {
          constraints.push(where('country', '==', filters.country));
        }
      }

      // Pet Type filter
      if (filters.type && filters.type !== 'all') {
        constraints.push(where('type', '==', filters.type.toLowerCase()));
      }

      // Vaccinated filter
      if (filters.vaccinated === true) {
        constraints.push(where('vaccinated', '==', true));
      }

      // Order by creation time
      // Note: If inequality operator (like !=) is used, Firestore requires orderBy on that field first
      if (filters.country === 'intl') {
        constraints.push(orderBy('country'));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Pagination
      if (isLoadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      constraints.push(limit(pageSize));

      const q = query(petsRef, ...constraints);
      const snapshot = await getDocs(q);

      let fetchedPets = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // In-memory refinement for search name, breed, gender, and age if needed
      if (filters.search) {
        const queryTerm = filters.search.toLowerCase().trim();
        fetchedPets = fetchedPets.filter(
          (p) =>
            p.name?.toLowerCase().includes(queryTerm) ||
            p.breed?.toLowerCase().includes(queryTerm) ||
            p.city?.toLowerCase().includes(queryTerm)
        );
      }

      if (filters.gender && filters.gender !== 'all') {
        fetchedPets = fetchedPets.filter((p) => p.gender?.toLowerCase() === filters.gender.toLowerCase());
      }

      if (filters.size && filters.size !== 'all') {
        fetchedPets = fetchedPets.filter((p) => p.size?.toLowerCase() === filters.size.toLowerCase());
      }

      if (isLoadMore) {
        setPets((prev) => [...prev, ...fetchedPets]);
      } else {
        setPets(fetchedPets);
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible || null);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Unable to load pets right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters.country, filters.type, filters.vaccinated, filters.search, filters.gender, filters.size, filters.includeAllStatuses, pageSize, lastDoc]);

  useEffect(() => {
    fetchPets(false);
  }, [filters.country, filters.type, filters.vaccinated, filters.search, filters.gender, filters.size, filters.includeAllStatuses]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPets(true);
    }
  };

  return { pets, loading, loadingMore, hasMore, loadMore, error, refetch: () => fetchPets(false) };
}
