import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { compressImage } from '../../utils/imageCompressor';
import { validatePetForm } from '../../utils/validation';
import { getSafeErrorMessage } from '../../utils/errorHandler';
import StatusPill from '../../components/StatusPill';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PET_TINTS, PET_ICONS, formatCurrency } from '../../components/PetCard';

const PRESET_TRAITS = [
  'Friendly',
  'Playful',
  'Calm',
  'House-trained',
  'Affectionate',
  'Good with Kids',
  'Good with Dogs',
  'Good with Cats',
  'High Energy',
  'Quiet',
  'Lap Pet'
];

export default function AdminPets() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [saving, setSaving] = useState(false);

  // Destructive delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    pet: null,
    loading: false
  });

  // Filters for admin table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form Fields
  const [petForm, setPetForm] = useState({
    name: '',
    type: 'dog',
    breed: '',
    ageText: '',
    gender: 'female',
    size: 'medium',
    vaccinated: true,
    neutered: true,
    city: '',
    country: 'India',
    fee: '1500',
    currency: 'INR',
    status: 'Available',
    description: '',
    traits: []
  });

  // Photo management state
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);

  // Document management state
  const [existingDocs, setExistingDocs] = useState([]);
  const [newDocFiles, setNewDocFiles] = useState([]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'pets'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPets(list);
    } catch (err) {
      console.error('Error fetching pets:', err);
      showToast(getSafeErrorMessage(err, 'Could not load pets list'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const openAddModal = () => {
    setEditingPet(null);
    setPetForm({
      name: '',
      type: 'dog',
      breed: '',
      ageText: '',
      gender: 'female',
      size: 'medium',
      vaccinated: true,
      neutered: true,
      city: '',
      country: 'India',
      fee: '1500',
      currency: 'INR',
      status: 'Available',
      description: '',
      traits: ['Friendly', 'Calm']
    });
    setExistingPhotos([]);
    setNewPhotoFiles([]);
    setNewPhotoPreviews([]);
    setExistingDocs([]);
    setNewDocFiles([]);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPet(p);
    setPetForm({
      name: p.name || '',
      type: p.type || 'dog',
      breed: p.breed || '',
      ageText: p.ageText || p.age || '',
      gender: p.gender || 'female',
      size: p.size || 'medium',
      vaccinated: p.vaccinated !== false,
      neutered: p.neutered !== false,
      city: p.city || '',
      country: p.country || 'India',
      fee: String(p.fee || '0').replace(/[^0-9]/g, '') || '0',
      currency: p.currency || 'INR',
      status: p.status || 'Available',
      description: p.description || '',
      traits: p.traits || ['Friendly']
    });
    setExistingPhotos(p.photos || []);
    setNewPhotoFiles([]);
    setNewPhotoPreviews([]);
    setExistingDocs(p.docs || []);
    setNewDocFiles([]);
    setModalOpen(true);
  };

  // Handle selecting new photos with live client-side preview
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = existingPhotos.length + newPhotoFiles.length + files.length;
    if (totalCount > 8) {
      showToast('Maximum 8 photos allowed in total');
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setNewPhotoFiles((prev) => [...prev, ...files]);
    setNewPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove existing photo
  const handleRemoveExistingPhoto = (indexToRemove) => {
    setExistingPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    showToast('Photo removed from listing');
  };

  // Set existing photo as primary cover image
  const handleSetCoverPhoto = (indexToCover) => {
    setExistingPhotos((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(indexToCover, 1);
      return [chosen, ...copy];
    });
    showToast('Primary cover photo updated');
  };

  // Remove pending new photo preview
  const handleRemoveNewPhoto = (indexToRemove) => {
    setNewPhotoFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setNewPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // Remove existing doc
  const handleRemoveExistingDoc = (indexToRemove) => {
    setExistingDocs((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    showToast('Document removed');
  };

  // Toggle personality trait
  const toggleTrait = (trait) => {
    setPetForm((prev) => {
      const current = prev.traits || [];
      if (current.includes(trait)) {
        return { ...prev, traits: current.filter((t) => t !== trait) };
      } else {
        return { ...prev, traits: [...current, trait] };
      }
    });
  };

  const handleSavePet = async (e) => {
    e.preventDefault();

    // Centralized form validation
    const validation = validatePetForm(petForm);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      showToast(firstError || 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      let targetPetId = editingPet?.id;

      if (!editingPet) {
        // Create new pet document first to obtain ID for storage paths
        const newDocRef = await addDoc(collection(db, 'pets'), {
          name: petForm.name.trim(),
          type: petForm.type.toLowerCase(),
          breed: petForm.breed.trim() || 'Mixed',
          ageText: petForm.ageText.trim() || 'Young',
          gender: petForm.gender,
          size: petForm.size,
          vaccinated: petForm.vaccinated,
          neutered: petForm.neutered,
          city: petForm.city.trim() || 'Mumbai',
          country: petForm.country.trim() || 'India',
          fee: petForm.fee,
          currency: petForm.currency,
          status: petForm.status,
          description: petForm.description.trim(),
          traits: petForm.traits || [],
          photos: [],
          docs: [],
          createdBy: user?.uid || 'admin',
          createdAt: serverTimestamp()
        });
        targetPetId = newDocRef.id;
      }

      // Upload any new photos with image compression
      let updatedPhotoUrls = [...existingPhotos];
      if (newPhotoFiles.length > 0) {
        showToast('Compressing and uploading new photos...');
        for (let i = 0; i < newPhotoFiles.length; i++) {
          const rawFile = newPhotoFiles[i];
          const compressed = await compressImage(rawFile, { maxWidth: 1600, quality: 0.82 });
          const photoPath = `pets/${targetPetId}/photos/${Date.now()}_${i}.jpg`;
          const photoRef = ref(storage, photoPath);
          await uploadBytes(photoRef, compressed);
          const downloadUrl = await getDownloadURL(photoRef);
          updatedPhotoUrls.push(downloadUrl);
        }
      }

      // Upload any new documents
      let updatedDocUrls = [...existingDocs];
      if (newDocFiles.length > 0) {
        for (let i = 0; i < newDocFiles.length; i++) {
          const docFile = newDocFiles[i];
          const docPath = `pets/${targetPetId}/docs/${Date.now()}_${docFile.name}`;
          const docRef = ref(storage, docPath);
          await uploadBytes(docRef, docFile);
          const docUrl = await getDownloadURL(docRef);
          updatedDocUrls.push(docUrl);
        }
      }

      // Update Firestore record
      const petDocRef = doc(db, 'pets', targetPetId);
      await updateDoc(petDocRef, {
        name: petForm.name.trim(),
        type: petForm.type.toLowerCase(),
        breed: petForm.breed.trim() || 'Mixed',
        ageText: petForm.ageText.trim() || 'Young',
        gender: petForm.gender,
        size: petForm.size,
        vaccinated: petForm.vaccinated,
        neutered: petForm.neutered,
        city: petForm.city.trim() || 'Mumbai',
        country: petForm.country.trim() || 'India',
        fee: petForm.fee,
        currency: petForm.currency,
        status: petForm.status,
        description: petForm.description.trim(),
        traits: petForm.traits || [],
        photos: updatedPhotoUrls,
        docs: updatedDocUrls,
        updatedAt: serverTimestamp()
      });

      setModalOpen(false);
      showToast(editingPet ? `${petForm.name} updated` : `${petForm.name} added`);
      await fetchPets();
    } catch (err) {
      console.error('Error saving pet details:', err);
      showToast(getSafeErrorMessage(err, 'Failed to save pet details'));
    } finally {
      setSaving(false);
    }
  };

  const requestDeletePet = (pet) => {
    setConfirmDelete({
      isOpen: true,
      pet,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.pet) return;

    try {
      setConfirmDelete((prev) => ({ ...prev, loading: true }));
      await deleteDoc(doc(db, 'pets', confirmDelete.pet.id));
      setPets((prev) => prev.filter((p) => p.id !== confirmDelete.pet.id));
      showToast('Pet removed');
      setConfirmDelete({ isOpen: false, pet: null, loading: false });
    } catch (err) {
      console.error('Error removing pet:', err);
      showToast(getSafeErrorMessage(err, 'Could not remove pet'));
      setConfirmDelete((prev) => ({ ...prev, loading: false }));
    }
  };

  // Filtered pet list for table
  const filteredPets = pets.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || (p.type || '').toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h1>Manage Pet Listings</h1>
            <p>Add new rescued pets, update existing profiles, manage galleries, and adjust availability status.</p>
          </div>
          <div className="acts">
            <Link to="/admin" className="btn sm ghost">
              ← Dashboard
            </Link>
            <button className="btn sm alt" onClick={openAddModal}>
              + Add pet
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search by pet name, breed, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Filter pets in admin inventory"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter pets by status"
          >
            <option value="all">All statuses</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Adopted">Adopted</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter pets by species type"
          >
            <option value="all">All types</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="rabbit">Rabbits</option>
            <option value="bird">Birds</option>
          </select>
        </div>

        {/* Pet List Panel */}
        <div className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>
              All Pets ({filteredPets.length} of {pets.length})
            </h3>
            <button className="btn alt sm" onClick={openAddModal}>
              + Add pet
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : filteredPets.length > 0 ? (
            filteredPets.map((p) => {
              const petType = (p.type || 'dog').toLowerCase();
              const bgTint = PET_TINTS[petType] || PET_TINTS.other;
              const icon = PET_ICONS[petType] || PET_ICONS.other;
              const photo = p.photos && p.photos.length > 0 ? p.photos[0] : null;

              return (
                <div key={p.id} className="item">
                  <div className="ico" style={{ background: bgTint }}>
                    {photo ? <img src={photo} alt={`${p.name} avatar`} /> : icon}
                  </div>
                  <div className="grow">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: 17 }}>{p.name}</b>
                      {p.photos && p.photos.length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--mint)', padding: '1px 6px', borderRadius: 6 }}>
                          📷 {p.photos.length} photos
                        </span>
                      )}
                    </div>
                    <small>
                      {p.breed} · {p.ageText || p.age} · {p.city}, {p.country} ·{' '}
                      {formatCurrency(p.fee, p.currency)}
                    </small>
                  </div>

                  <StatusPill status={p.status} />

                  <div className="acts">
                    <button
                      className="btn sm ghost"
                      onClick={() => openEditModal(p)}
                      aria-label={`Edit ${p.name}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn sm bad"
                      onClick={() => requestDeletePet(p)}
                      aria-label={`Remove ${p.name}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No pets found matching your search and filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Add / Edit Pet Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPet ? `Edit ${editingPet.name}` : 'Add a New Pet'}
        subtitle={
          editingPet
            ? `Update ${editingPet.name}'s specifications, gallery images, documents, and adoption fee.`
            : 'Fill out the details below. This pet will immediately become discoverable on the Find a pet page.'
        }
        wide={true}
      >
        <form onSubmit={handleSavePet}>
          {/* Section: Basic Details */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, color: 'var(--forest)', marginBottom: 12 }}>1. Basic Information</h4>

            <div className="two">
              <div className="field">
                <label htmlFor="pName">Pet Name *</label>
                <input
                  id="pName"
                  type="text"
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  placeholder="e.g. Bruno"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="pType">Pet Species / Type</label>
                <select
                  id="pType"
                  value={petForm.type}
                  onChange={(e) => setPetForm({ ...petForm, type: e.target.value })}
                >
                  <option value="dog">🐕 Dog</option>
                  <option value="cat">🐈 Cat</option>
                  <option value="rabbit">🐇 Rabbit</option>
                  <option value="bird">🦜 Bird</option>
                  <option value="other">🐾 Other Companion Animal</option>
                </select>
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="pBreed">Breed / Mix</label>
                <input
                  id="pBreed"
                  type="text"
                  value={petForm.breed}
                  onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                  placeholder="e.g. Indie / Labrador mix / Bengal"
                />
              </div>

              <div className="field">
                <label htmlFor="pAge">Age Text</label>
                <input
                  id="pAge"
                  type="text"
                  value={petForm.ageText}
                  onChange={(e) => setPetForm({ ...petForm, ageText: e.target.value })}
                  placeholder="e.g. 2 yrs / 8 months"
                />
              </div>
            </div>

            <div className="three">
              <div className="field">
                <label htmlFor="pGender">Gender</label>
                <select
                  id="pGender"
                  value={petForm.gender}
                  onChange={(e) => setPetForm({ ...petForm, gender: e.target.value })}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="pSize">Size</label>
                <select
                  id="pSize"
                  value={petForm.size}
                  onChange={(e) => setPetForm({ ...petForm, size: e.target.value })}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="pStatus">Availability Status</label>
                <select
                  id="pStatus"
                  value={petForm.status}
                  onChange={(e) => setPetForm({ ...petForm, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved (Application Pending)</option>
                  <option value="Adopted">Adopted (Found Home)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Photos & Media Management */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 16 }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <h4 style={{ fontSize: 16, color: 'var(--forest)', margin: 0 }}>
                2. Photos & Gallery ({existingPhotos.length + newPhotoFiles.length} / 8 photos)
              </h4>
            </div>
            <p className="help-text">
              The first photo is displayed as the primary cover card. Click "Set as Cover" on any photo to reorder it.
            </p>

            {/* Existing Photos Grid */}
            {existingPhotos.length > 0 && (
              <div className="photo-manager-grid">
                {existingPhotos.map((url, idx) => (
                  <div key={idx} className={`photo-preview-item ${idx === 0 ? 'is-cover' : ''}`}>
                    <img src={url} alt={`Existing photo ${idx + 1}`} />
                    {idx === 0 && <span className="photo-badge-cover">Cover</span>}
                    <div className="photo-actions-overlay">
                      {idx !== 0 ? (
                        <button
                          type="button"
                          className="photo-btn-cover"
                          onClick={() => handleSetCoverPhoto(idx)}
                          title="Make this the primary cover image"
                        >
                          ★ Cover
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>Primary</span>
                      )}
                      <button
                        type="button"
                        className="photo-btn-del"
                        onClick={() => handleRemoveExistingPhoto(idx)}
                        title="Delete photo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending New Photo Previews */}
            {newPhotoPreviews.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <small style={{ fontWeight: 700, color: 'var(--forest)' }}>
                  New Photos to Upload on Save ({newPhotoPreviews.length}):
                </small>
                <div className="photo-manager-grid">
                  {newPhotoPreviews.map((previewUrl, idx) => (
                    <div key={idx} className="photo-preview-item">
                      <img src={previewUrl} alt={`New upload ${idx + 1}`} />
                      <span className="photo-badge-new">New</span>
                      <div className="photo-actions-overlay">
                        <span style={{ fontSize: 11, color: '#fff' }}>Pending</span>
                        <button
                          type="button"
                          className="photo-btn-del"
                          onClick={() => handleRemoveNewPhoto(idx)}
                          title="Cancel upload"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Dropzone */}
            {existingPhotos.length + newPhotoFiles.length < 8 && (
              <div className="dropzone-box" style={{ marginTop: 10 }}>
                <label htmlFor="pNewPhotos" style={{ cursor: 'pointer', margin: 0 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
                  <b style={{ color: 'var(--forest)' }}>Add Photos</b>
                  <p className="help-text" style={{ margin: '4px 0 0' }}>
                    Click to select photos. Automatic client-side compression will optimize images for fast loading.
                  </p>
                </label>
                <input
                  id="pNewPhotos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Section: Location & Adoption Fee */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, color: 'var(--forest)', marginBottom: 12 }}>3. Location & Adoption Fee</h4>

            <div className="two">
              <div className="field">
                <label htmlFor="pCity">City</label>
                <input
                  id="pCity"
                  type="text"
                  value={petForm.city}
                  onChange={(e) => setPetForm({ ...petForm, city: e.target.value })}
                  placeholder="e.g. Mumbai / Toronto / Berlin"
                />
              </div>

              <div className="field">
                <label htmlFor="pCountry">Country</label>
                <input
                  id="pCountry"
                  type="text"
                  value={petForm.country}
                  onChange={(e) => setPetForm({ ...petForm, country: e.target.value })}
                  placeholder="e.g. India / Canada / Germany"
                />
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="pFee">Adoption Fee Amount</label>
                <input
                  id="pFee"
                  type="number"
                  value={petForm.fee}
                  onChange={(e) => setPetForm({ ...petForm, fee: e.target.value })}
                  placeholder="1500"
                />
              </div>

              <div className="field">
                <label htmlFor="pCurrency">Currency</label>
                <select
                  id="pCurrency"
                  value={petForm.currency}
                  onChange={(e) => setPetForm({ ...petForm, currency: e.target.value })}
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="GBP">GBP (£ British Pound)</option>
                  <option value="CAD">CAD ($ Canadian Dollar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Health & Medical Documents */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, color: 'var(--forest)', marginBottom: 12 }}>4. Health & Medical Verification</h4>

            <div className="two">
              <div className="checkbox-field" style={{ margin: '8px 0' }}>
                <input
                  id="pVaccinated"
                  type="checkbox"
                  checked={petForm.vaccinated}
                  onChange={(e) => setPetForm({ ...petForm, vaccinated: e.target.checked })}
                />
                <label htmlFor="pVaccinated">Fully vaccinated and dewormed</label>
              </div>

              <div className="checkbox-field" style={{ margin: '8px 0' }}>
                <input
                  id="pNeutered"
                  type="checkbox"
                  checked={petForm.neutered}
                  onChange={(e) => setPetForm({ ...petForm, neutered: e.target.checked })}
                />
                <label htmlFor="pNeutered">Spayed / Neutered</label>
              </div>
            </div>

            {/* Existing Documents List */}
            {existingDocs.length > 0 && (
              <div style={{ marginTop: 10, marginBottom: 12 }}>
                <label>Existing Medical Records:</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {existingDocs.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--mint)',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 13
                      }}
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--forest)', fontWeight: 600 }}>
                        📄 Document {idx + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingDoc(idx)}
                        style={{ color: 'var(--coral)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                        aria-label={`Remove document ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="pDocs">Attach Vaccination / Vet Papers (PDF or images)</label>
              <input
                id="pDocs"
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => setNewDocFiles(Array.from(e.target.files))}
              />
            </div>
          </div>

          {/* Section: Personality & Description */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 16, color: 'var(--forest)', marginBottom: 8 }}>5. Personality Traits & Story</h4>

            <div className="field">
              <label>Select Personality Traits:</label>
              <div className="trait-selector">
                {PRESET_TRAITS.map((trait) => {
                  const isActive = (petForm.traits || []).includes(trait);
                  return (
                    <button
                      key={trait}
                      type="button"
                      className={`trait-tag ${isActive ? 'active' : ''}`}
                      onClick={() => toggleTrait(trait)}
                    >
                      {isActive ? `✓ ${trait}` : `+ ${trait}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="pDesc">About {petForm.name || 'this pet'} (Story & Routine)</label>
              <textarea
                id="pDesc"
                rows="4"
                value={petForm.description}
                onChange={(e) => setPetForm({ ...petForm, description: e.target.value })}
                placeholder="Describe their rescue background, temperament with adults and children, favorite toys, feeding schedule, and ideal home environment..."
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="row" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving changes...' : editingPet ? `Update ${petForm.name}` : 'Save pet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Accessible Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title={`Remove ${confirmDelete.pet?.name || 'Pet'}?`}
        message={`Are you sure you want to permanently delete ${confirmDelete.pet?.name || 'this pet'} from the Pawhome directory? This will remove all associated gallery photos.`}
        confirmText="Remove Pet"
        cancelText="Cancel"
        isDestructive={true}
        loading={confirmDelete.loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, pet: null, loading: false })}
      />
    </section>
  );
}
