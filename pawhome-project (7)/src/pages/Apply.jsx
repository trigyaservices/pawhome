import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { PET_TINTS, PET_ICONS } from '../components/PetCard';

export default function Apply() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [pet, setPet] = useState(null);
  const [loadingPet, setLoadingPet] = useState(true);
  const [existingApp, setExistingApp] = useState(null);
  const [checkingApp, setCheckingApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Honeypot spam trap
  const [honeypot, setHoneypot] = useState('');

  usePageMeta(
    pet ? `Adopt ${pet.name}` : 'Adoption Application',
    'Submit your ethical pet adoption application on Pawhome.'
  );

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    country: 'India',
    homeType: 'Apartment',
    ownershipStatus: 'Own',
    otherPets: 'None',
    experience: 'Experienced',
    dailyHoursAtHome: '8',
    reason: '',
    agreed: false
  });

  const [idProofFile, setIdProofFile] = useState(null);
  const [landlordFile, setLandlordFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Prefill with user profile if available
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.name || user?.displayName || '',
        phone: prev.phone || profile.phone || '',
        city: prev.city || profile.city || '',
        country: prev.country || profile.country || 'India'
      }));
    }
  }, [profile, user]);

  // Load Pet details and check for existing pending applications
  useEffect(() => {
    async function init() {
      try {
        setLoadingPet(true);
        const petRef = doc(db, 'pets', petId);
        const petSnap = await getDoc(petRef);

        if (!petSnap.exists()) {
          setPet(null);
          setLoadingPet(false);
          return;
        }

        const pData = { id: petSnap.id, ...petSnap.data() };
        setPet(pData);

        if (user) {
          const appsRef = collection(db, 'applications');
          const q = query(
            appsRef,
            where('userId', '==', user.uid),
            where('petId', '==', petId),
            where('status', '==', 'pending')
          );
          const appsSnap = await getDocs(q);
          if (!appsSnap.empty) {
            setExistingApp({ id: appsSnap.docs[0].id, ...appsSnap.docs[0].data() });
          }
        }
      } catch (err) {
        console.error('Error fetching pet or existing application:', err);
      } finally {
        setLoadingPet(false);
        setCheckingApp(false);
      }
    }
    init();
  }, [petId, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';

    // Phone validation (international & Indian standard)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number with area code';
    }

    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.country.trim()) errors.country = 'Country is required';

    if (!formData.reason.trim() || formData.reason.trim().length < 20) {
      errors.reason = 'Please explain your reason for adopting in at least 20 characters';
    }

    if (!idProofFile) {
      errors.idProof = 'A government-issued ID proof document or photo is required';
    } else if (idProofFile.size > 10 * 1024 * 1024) {
      errors.idProof = 'ID proof file must be under 10 MB';
    }

    if (formData.ownershipStatus === 'Rent') {
      if (!landlordFile) {
        errors.landlord = 'Landlord permission document is required for rented properties';
      } else if (landlordFile.size > 10 * 1024 * 1024) {
        errors.landlord = 'Landlord permission file must be under 10 MB';
      }
    }

    if (!formData.agreed) {
      errors.agreed = 'You must agree to Pawhome adoption welfare terms';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Spam protection: check honeypot trap
    if (honeypot.trim()) {
      console.warn('Bot detected via honeypot trap.');
      showToast('Application sent. We will email you the decision.');
      navigate('/account');
      return;
    }

    // Rate-limiting check: 20 seconds cooldown between submissions
    const lastSubmitTime = Number(sessionStorage.getItem('pawhome_last_app_submit') || 0);
    if (Date.now() - lastSubmitTime < 20000) {
      showToast('Please wait a moment before sending another application.');
      return;
    }

    if (!validate()) {
      showToast('Please fix the errors in the form before sending');
      return;
    }

    try {
      setSubmitting(true);

      // Create application reference in Firestore first to generate ID
      const newAppRef = await addDoc(collection(db, 'applications'), {
        petId,
        petName: pet.name,
        petType: pet.type,
        userId: user.uid,
        userEmail: user.email,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        homeType: formData.homeType,
        ownershipStatus: formData.ownershipStatus,
        otherPets: formData.otherPets,
        experience: formData.experience,
        dailyHoursAtHome: Number(formData.dailyHoursAtHome) || 8,
        reason: formData.reason.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        adminNotes: '',
        decisionReason: ''
      });

      const appId = newAppRef.id;

      // Upload ID proof to private storage
      const idProofExt = idProofFile.name.split('.').pop() || 'file';
      const idProofPath = `applications/${appId}/idProofs/id_proof.${idProofExt}`;
      const idStorageRef = ref(storage, idProofPath);
      await uploadBytes(idStorageRef, idProofFile);

      let landlordPermPath = null;
      if (landlordFile) {
        const landExt = landlordFile.name.split('.').pop() || 'file';
        landlordPermPath = `applications/${appId}/landlordPerms/landlord_permission.${landExt}`;
        const landStorageRef = ref(storage, landlordPermPath);
        await uploadBytes(landStorageRef, landlordFile);
      }

      // Update application with storage paths
      await updateDoc(newAppRef, {
        idProofPath,
        landlordPermPath
      });

      // Update pet status to Reserved while pending application is active
      try {
        const petDocRef = doc(db, 'pets', petId);
        await updateDoc(petDocRef, {
          status: 'Reserved'
        });
      } catch (err) {
        console.warn('Could not auto-reserve pet directly (may be handled by Cloud Function trigger):', err);
      }

      sessionStorage.setItem('pawhome_last_app_submit', String(Date.now()));
      showToast('Application sent. We will email you the decision.');
      navigate('/account');
    } catch (err) {
      console.error('Error submitting application:', err);
      showToast('Could not submit application. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPet || checkingApp) {
    return (
      <section className="block">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="skeleton" style={{ height: 40, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </section>
    );
  }

  if (!pet) {
    return (
      <section className="block">
        <div className="wrap">
          <div className="empty">
            <h3>Pet not found</h3>
            <p>The pet you are attempting to adopt does not exist.</p>
            <Link to="/" className="btn alt">
              Find another pet
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (existingApp) {
    return (
      <section className="block">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="panel" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--forest)' }}>Application Already Submitted</h3>
            <p className="meta" style={{ margin: '14px 0 20px', fontSize: 16 }}>
              You already have an active pending application for <b>{pet.name}</b>. Our team reviews all applications within 2 to 3 days.
            </p>
            <Link to="/account" className="btn">
              View My Applications
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const petType = (pet.type || 'other').toLowerCase();
  const bgTint = PET_TINTS[petType] || PET_TINTS.other;
  const icon = PET_ICONS[petType] || PET_ICONS.other;

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 680 }}>
        <div className="panel" style={{ padding: 32 }}>
          {/* Header */}
          <div className="row" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 28 }}>Adopt {pet.name}</h2>
              <p className="sub" style={{ margin: 0 }}>
                Takes about 3 minutes. We review every application in 2 to 3 days.
              </p>
            </div>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: bgTint,
                display: 'grid',
                placeItems: 'center',
                fontSize: 30
              }}
            >
              {icon}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Honeypot anti-spam trap */}
            <input
              type="text"
              name="user_organization_website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Full Name */}
            <div className="field">
              <label htmlFor="fullName">Full name *</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Riya Sharma"
                required
              />
              {formErrors.fullName && <div className="error-text">{formErrors.fullName}</div>}
            </div>

            {/* Phone & City */}
            <div className="two">
              <div className="field">
                <label htmlFor="phone">Phone number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                />
                {formErrors.phone && <div className="error-text">{formErrors.phone}</div>}
              </div>

              <div className="field">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Pune"
                  required
                />
                {formErrors.city && <div className="error-text">{formErrors.city}</div>}
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="country">Country *</label>
                <select id="country" name="country" value={formData.country} onChange={handleChange}>
                  <option value="India">India</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Other">Other International</option>
                </select>
                {formErrors.country && <div className="error-text">{formErrors.country}</div>}
              </div>

              <div className="field">
                <label htmlFor="homeType">Home type</label>
                <select id="homeType" name="homeType" value={formData.homeType} onChange={handleChange}>
                  <option value="Apartment">Apartment</option>
                  <option value="House with garden">House with garden</option>
                  <option value="Farm">Farm / Independent house</option>
                </select>
              </div>
            </div>

            {/* Ownership & Landlord permission */}
            <div className="two">
              <div className="field">
                <label htmlFor="ownershipStatus">Housing status</label>
                <select
                  id="ownershipStatus"
                  name="ownershipStatus"
                  value={formData.ownershipStatus}
                  onChange={handleChange}
                >
                  <option value="Own">Owned by me / family</option>
                  <option value="Rent">Rented</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="dailyHoursAtHome">Daily hours at home</label>
                <input
                  id="dailyHoursAtHome"
                  name="dailyHoursAtHome"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.dailyHoursAtHome}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* If Rented: Landlord upload */}
            {formData.ownershipStatus === 'Rent' && (
              <div className="field" style={{ background: 'var(--mint)', padding: 14, borderRadius: 'var(--r-in)' }}>
                <label htmlFor="landlordPerm">Landlord Permission Proof (PDF or Image) *</label>
                <p className="help-text">Proof that pets are allowed by your landlord or housing society.</p>
                <input
                  id="landlordPerm"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setLandlordFile(e.target.files[0] || null)}
                />
                {formErrors.landlord && <div className="error-text">{formErrors.landlord}</div>}
              </div>
            )}

            {/* Other pets & Experience */}
            <div className="two">
              <div className="field">
                <label htmlFor="otherPets">Other pets at home</label>
                <select id="otherPets" name="otherPets" value={formData.otherPets} onChange={handleChange}>
                  <option value="None">None</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Both">Both (Dog & Cat)</option>
                  <option value="Other">Other pets</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="experience">Prior pet experience</label>
                <select id="experience" name="experience" value={formData.experience} onChange={handleChange}>
                  <option value="Experienced">Experienced pet guardian</option>
                  <option value="Beginner">First-time pet owner</option>
                  <option value="Growing">Grew up with family pets</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="field">
              <label htmlFor="reason">Why do you want to adopt {pet.name}? *</label>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                value={formData.reason}
                onChange={handleChange}
                placeholder={`Share why you would like to welcome ${pet.name} into your home and routine...`}
                required
              />
              {formErrors.reason && <div className="error-text">{formErrors.reason}</div>}
            </div>

            {/* ID Proof Upload */}
            <div className="field">
              <label htmlFor="idProof">Government ID Proof (Aadhaar, Passport, Driver's License) *</label>
              <p className="help-text">Stored securely in private encrypted storage. Only Pawhome reviewers can inspect this.</p>
              <input
                id="idProof"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdProofFile(e.target.files[0] || null)}
                required
              />
              {formErrors.idProof && <div className="error-text">{formErrors.idProof}</div>}
            </div>

            {/* Agreement Checkbox */}
            <div className="checkbox-field">
              <input
                id="agreed"
                name="agreed"
                type="checkbox"
                checked={formData.agreed}
                onChange={handleChange}
              />
              <label htmlFor="agreed">
                I agree to the <Link to="/terms" target="_blank" style={{ color: 'var(--forest)', textDecoration: 'underline' }}>Terms and Conditions</Link> and <Link to="/policy" target="_blank" style={{ color: 'var(--forest)', textDecoration: 'underline' }}>Adoption Welfare Policy</Link>. I understand the adoption fee will only be payable after application approval.
              </label>
            </div>
            {formErrors.agreed && <div className="error-text" style={{ marginTop: -8, marginBottom: 16 }}>{formErrors.agreed}</div>}

            {/* Single Clear Primary CTA */}
            <div className="row" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={submitting}
              >
                {submitting ? 'Sending application...' : 'Send application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
