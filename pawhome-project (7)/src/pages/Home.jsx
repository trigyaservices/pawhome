import React, { useState } from 'react';
import Hero from '../components/Hero';
import PetCard from '../components/PetCard';
import { usePets } from '../hooks/usePets';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Home() {
  usePageMeta('Find a Companion Pet', 'Browse verified dogs, cats, rabbits, and birds from ethical rescue partners across India and worldwide.');

  const [filters, setFilters] = useState({
    country: 'all',
    type: 'all',
    search: '',
    gender: 'all',
    size: 'all',
    vaccinated: false
  });

  const { pets, loading, loadingMore, hasMore, loadMore, error } = usePets(filters);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      country: 'all',
      type: 'all',
      search: '',
      gender: 'all',
      size: 'all',
      vaccinated: false
    });
  };

  return (
    <>
      <Hero />

      <section className="block" id="pets">
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Pets looking for a home</h2>
              <p>
                {loading
                  ? 'Finding loving pets...'
                  : `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} available right now`}
              </p>
            </div>
          </div>

          <div className="filters">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, breed, or city..."
              className="search-input"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              aria-label="Search pets by name, breed, or location"
            />

            {/* Country Selector */}
            <select
              id="fc"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              aria-label="Filter by country"
            >
              <option value="all">All countries</option>
              <option value="in">India</option>
              <option value="intl">International</option>
              <option value="Canada">Canada</option>
              <option value="Germany">Germany</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
            </select>

            {/* Pet Type Selector */}
            <select
              id="ft"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              aria-label="Filter by pet type"
            >
              <option value="all">All pets</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="rabbit">Rabbits</option>
              <option value="bird">Birds</option>
            </select>

            {/* Gender Selector */}
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              aria-label="Filter by gender"
            >
              <option value="all">Any gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>

            {/* Size Selector */}
            <select
              value={filters.size}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              aria-label="Filter by size"
            >
              <option value="all">Any size</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>

            {/* Vaccinated Checkbox */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={filters.vaccinated}
                onChange={(e) => handleFilterChange('vaccinated', e.target.checked)}
                style={{ width: 'auto' }}
              />
              Vaccinated only
            </label>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card" style={{ height: 330 }}>
                  <div className="skeleton" style={{ height: 190 }} />
                  <div style={{ padding: 18 }}>
                    <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 32, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="empty">
              <h3 style={{ color: 'var(--coral)' }}>Unable to load pets</h3>
              <p>{error}</p>
              <button className="btn sm" onClick={handleResetFilters}>
                Try again
              </button>
            </div>
          ) : pets.length > 0 ? (
            <>
              <div className="grid">
                {pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <button
                    className="btn alt"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading more pets...' : 'Load more pets'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <h3>No pets match these filters</h3>
              <p>Try clearing your search query or switching to "All countries" or "All pets".</p>
              <button className="btn sm alt" onClick={handleResetFilters} style={{ marginTop: 8 }}>
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
