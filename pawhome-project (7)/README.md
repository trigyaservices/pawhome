# Pawhome – Pet Adoption Platform

**Pawhome** is a full-featured, production-ready pet adoption platform designed for India and international communities. Built with React 18, Vite, plain CSS (strictly preserving the visual aesthetic, colors, typography, swinging tags, status pills, and stepper of `pet-adoption-ui.html`), Firebase Authentication, Cloud Firestore, Cloud Storage, and Node 20 Cloud Functions.

---

## Architecture Overview

```
pawhome/
├── .env.example              # Client-side environment variables template
├── .firebaserc.example       # Firebase project alias template
├── firebase.json             # Hosting, rules, functions, and emulator definitions
├── firestore.rules           # Role-based Firestore security rules
├── firestore.indexes.json    # Composite query indexes
├── storage.rules             # File type and privacy storage security rules
├── package.json              # Frontend & root scripts
├── pet-adoption-ui.html      # Original visual design prototype
├── vite.config.js            # Vite bundler configuration
├── index.html                # HTML entry point with Bricolage Grotesque & DM Sans
├── src/
│   ├── main.jsx              # React root mount
│   ├── App.jsx               # Router & route definitions
│   ├── styles/
│   │   ├── variables.css     # Design tokens (--ink, --forest, --mint, --marigold, etc.)
│   │   ├── base.css          # Resets, typography, prefers-reduced-motion
│   │   ├── components.css    # Cards, hero swinging tags, stepper, status pills, modals, toasts
│   │   ├── layout.css        # Responsive layouts, headers, footers, pet gallery
│   │   └── main.css          # CSS bundle entrypoint
│   ├── lib/
│   │   └── firebase.js       # Firebase client SDK initialization & emulator connection
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Auth state, Google & email sign-in, custom claims role check
│   │   └── ToastContext.jsx  # Action-aligned toast notifications
│   ├── hooks/
│   │   ├── usePets.js        # Pet querying, multi-factor filtering, and pagination
│   │   ├── useWishlist.js    # Real-time Firestore wishlist sync
│   │   └── useNotifications.js # Real-time user notification bell & drawer
│   ├── components/
│   │   ├── Header.jsx        # Navigation for Visitors, Adopters, and Admins
│   │   ├── Footer.jsx        # Platform footer and policy links
│   │   ├── Hero.jsx          # Hero section with animated swinging tags
│   │   ├── PetCard.jsx       # Pet card with category tints, fee formatting, wishlist heart
│   │   ├── Stepper.jsx       # 4-stage live adoption progress stepper
│   │   ├── StatusPill.jsx    # Status indicators matching prototype
│   │   ├── Modal.jsx         # Accessible modal dialog with Esc / backdrop support
│   │   ├── NotificationBell.jsx # Unread count badge and notification drawer
│   │   ├── ProtectedRoute.jsx # Route guard with login redirect preservation
│   │   └── AdminRoute.jsx    # Administrator role gatekeeper
│   ├── utils/
│   │   └── imageCompressor.js # Client-side image compression prior to Storage upload
│   └── pages/
│       ├── Home.jsx          # Public browse, multi-filter & search
│       ├── PetDetail.jsx     # Pet profile, gallery, health, fee, adopt action
│       ├── Apply.jsx         # 3-minute adoption form with private ID proof upload
│       ├── Account.jsx       # My applications, wishlist, certificates, monthly updates
│       ├── Profile.jsx       # User contact information update
│       ├── VerifyCertificate.jsx # Public tamper-evident certificate verification (/verify/:certId)
│       ├── Login.jsx         # Email & Google authentication with return path redirect
│       ├── Signup.jsx        # User registration with location details
│       ├── ForgotPassword.jsx# Password reset email trigger
│       ├── HowItWorks.jsx    # 5-step ethical adoption guide
│       ├── FAQ.jsx           # Accordion frequently asked questions
│       ├── Contact.jsx       # Rescue contact and support inquiry
│       ├── Policy.jsx        # Animal welfare & no-kill commitments
│       ├── Privacy.jsx       # Private document protection policy
│       ├── NotFound.jsx      # Friendly 404 handler
│       └── admin/
│           ├── AdminDashboard.jsx    # Stat cards, monthly adoptions chart, recent queue
│           ├── AdminApplications.jsx # Status filters, private ID proof viewer, notes, accept/reject
│           ├── AdminPets.jsx         # Pet list, add/edit form, 8-photo compression upload
│           ├── AdminAdoptions.jsx    # Completed adoptions registry & certificate links
│           ├── AdminReports.jsx      # Monthly update reviews, reminder trigger, welfare tagging
│           ├── AdminUsers.jsx        # Registered adopters directory
│           └── AdminSettings.jsx     # Supported countries, currencies, email copy templates
├── functions/
│   ├── package.json          # Node 20 runtime dependencies (pdf-lib, qrcode, resend)
│   ├── index.js              # Cloud Functions (triggers, callables, schedulers, verify endpoint)
│   ├── emailService.js       # Transactional email dispatcher with HTML templates
│   └── generateCertificate.js# pdf-lib PDF certificate generator with QR code
├── scripts/
│   ├── make-admin.js         # CLI script to grant Firebase Auth custom claim { role: "admin" }
│   └── seed.js               # Database seeder (8 pets: India & abroad + site settings)
└── tests/
    ├── functions.test.js     # Decision logic, cert ID formatting, lifecycle transitions tests
    └── rules.test.js         # Security rules and size constraint assertions
```

---

## Deployment & Setup Guide (Step-by-Step)

Follow these steps in order to set up, test, and deploy Pawhome.

### 1. Create the Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name your project (e.g. `pawhome-app`).
3. Google Analytics can be enabled or disabled according to your preference.
4. **Important (Blaze Plan):** In the bottom-left corner of the console, upgrade your project to the **Blaze (Pay as you go)** plan.
   > **Note:** Cloud Functions (Node 20 runtime) and Cloud Scheduler (used for 1st-of-month reports and 8th-of-month reminders) strictly require the Blaze plan. Firebase provides a generous free tier each month (2M invocations, 3 free Cloud Scheduler jobs).

---

### 2. Enable Firebase Services

In the Firebase Console for your project:

1. **Authentication:**
   - Go to **Build > Authentication** and click **Get started**.
   - Under the **Sign-in method** tab:
     - Enable **Email/Password**.
     - Enable **Google** (select your project support email and save).
2. **Cloud Firestore:**
   - Go to **Build > Firestore Database** and click **Create database**.
   - Choose a location closest to your primary audience (e.g. `asia-south1` for India or `us-central1`).
   - Start in **Production mode** (our `firestore.rules` will be deployed automatically).
3. **Cloud Storage:**
   - Go to **Build > Storage** and click **Get started**.
   - Accept default bucket creation in the same region.
4. **Firebase Hosting:**
   - Go to **Build > Hosting** and click **Get started**.

---

### 3. Install Dependencies & Configure Environment Keys

Clone or open the project folder in your terminal:

```bash
# 1. Install frontend and script dependencies
npm install

# 2. Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

#### Configure Frontend Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Open `.env.local` and replace the placeholder values with your Firebase Web App configuration (obtained from **Firebase Console > Project settings > General > Your apps > Web app**):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
VITE_USE_FIREBASE_EMULATORS=false
VITE_APP_URL=http://localhost:3000
```

#### Configure Cloud Functions Environment
Set the required environment configuration for your email provider (Resend or SendGrid) and application URL:

For local development or Firebase emulator, create `functions/.env`:
```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Pawhome Adoptions <adoptions@yourverifieddomain.com>
ADMIN_EMAIL=admin@yourverifieddomain.com
APP_URL=http://localhost:3000
```

For production deployment, set them using Firebase Functions secrets or configuration:
```bash
firebase functions:secrets:set RESEND_API_KEY
```

---

### 4. Run Locally with Firebase Emulators

Pawhome is configured to run fully offline with local Firebase emulators (Auth, Firestore, Storage, Functions, and Hosting).

1. Ensure the Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Link your Firebase project:
   ```bash
   cp .firebaserc.example .firebaserc
   # Edit .firebaserc to set your actual Firebase project ID
   ```
3. Start the emulators:
   ```bash
   firebase emulators:start
   ```
   The emulator UI will be available at `http://localhost:4000`.
4. In another terminal, start the Vite frontend development server:
   ```bash
   # Set VITE_USE_FIREBASE_EMULATORS=true in .env.local
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

### 5. Create the First Admin User

Admins never sign up from a public page. To establish your first administrator:

1. Sign up a regular user account on Pawhome via the website (`/signup`) or via the Firebase Console / Auth Emulator.
   - Example email: `director@pawhome.org`
2. Run the provided administrative CLI script:
   ```bash
   node scripts/make-admin.js director@pawhome.org
   ```
3. The script will:
   - Assign the custom claim `{ role: "admin" }` to the account via Firebase Admin SDK.
   - Update `users/{uid}` with `role: "admin"`.
4. Log out and log back in on the website. You will now have access to the protected `/admin/*` routes and administrative dashboard.

---

### 6. Seed Sample Pets and Platform Settings

Populate your database with 8 diverse sample pets (India and international) and site configuration:

```bash
# Against local emulator:
FIRESTORE_EMULATOR_HOST="localhost:8080" node scripts/seed.js

# Against production Firebase (ensure service account or application credentials are set):
node scripts/seed.js
```

This seeds:
- **Bruno** (Dog, Indie, 2 yrs, Mumbai, India – Available)
- **Mishti** (Cat, Bengal mix, 1 yr, Pune, India – Adopted)
- **Luna** (Dog, Labrador mix, 3 yrs, Toronto, Canada – Available)
- **Coco** (Rabbit, Dutch, 8 months, Berlin, Germany – Available)
- **Kiwi** (Bird, Rose-ringed parakeet, 4 yrs, Delhi, India – Available)
- **Oscar** (Cat, British shorthair, 5 yrs, London, UK – Available)
- **Bella** (Dog, Golden Retriever mix, 1.5 yrs, Bengaluru, India – Available)
- **Milo** (Dog, Beagle mix, 4 yrs, New York, USA – Available)
- `settings/site` configuration for regional currencies, review thresholds, and email templates.

---

### 7. Run Automated Tests

Run the built-in Node.js automated test suite verifying business logic, adoption decisions, certificate ID schemes, and security rule invariants:

```bash
npm test
```

---

### 8. Deploy to Production

1. Build the production React frontend bundle:
   ```bash
   npm run build
   ```
2. Deploy Firestore rules, Storage rules, Cloud Functions, and Hosting:
   ```bash
   firebase deploy
   ```
3. Or deploy individual components:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   firebase deploy --only functions
   firebase deploy --only hosting
   ```

---

### 9. Connect a Custom Domain

1. In the [Firebase Console](https://console.firebase.google.com/), go to **Build > Hosting**.
2. Click **Add custom domain** (e.g. `pawhome.org` or `adoptions.pawhome.org`).
3. Enter your domain name and follow the verification instructions.
4. Add the provided `TXT` and `A` records in your domain registrar's DNS management panel (GoDaddy, Namecheap, Cloudflare, etc.).
5. Firebase will automatically issue and provision an SSL certificate (typically takes 1 to 24 hours).

---

## What You Must Configure Manually

After cloning and deploying, complete this brief manual checklist:

- [ ] **Email Provider API Key:** Create an account on [Resend](https://resend.com) (or [SendGrid](https://sendgrid.com)) and obtain an API key. Add it to `functions/.env` as `RESEND_API_KEY`.
- [ ] **Email Domain Verification:** Verify your sending domain (e.g. `yourdomain.com`) in your email provider dashboard so outbound emails pass SPF, DKIM, and DMARC without going to spam.
- [ ] **Custom Domain DNS:** Map your custom domain in Firebase Hosting and verify the DNS records.
- [ ] **Admin Signature Image:** Replace the default certificate seal with your authorized shelter director signature or stamp image in `functions/generateCertificate.js`.
- [ ] **Shelter Logo / Favicon:** Customize the paw print logo icon in `index.html` and header if your organization uses a registered trademark or custom vector logo.
- [ ] **Authorized Google OAuth Redirect URI:** If using Google Sign-In with your custom domain, add `https://yourdomain.com/__/auth/handler` to the Authorized redirect URIs in Google Cloud Console > APIs & Services > Credentials.

---

## Assumptions & Design Choices

1. **Role Resolution:** We implemented custom claims `{ role: "admin" }` checked on `idTokenResult.claims.role`, with a synchronized backup in Firestore `users/{uid}`. This guarantees that non-admin clients cannot tamper with status decisions, while enabling fast UI checks.
2. **Currency Presentation:** Each pet displays fees in its rescue location's natural currency (INR `₹`, USD `$`, EUR `€`, GBP `£`, CAD `$ CAD`).
3. **Private Document Storage:** ID proofs and landlord permission documents are saved under `applications/{appId}/idProofs/` and `applications/{appId}/landlordPerms/`. In `storage.rules`, these are accessible exclusively to the applicant who submitted them and authorized platform administrators.
4. **Certificate QR Verification:** The QR code on every generated certificate points to `/verify/:certId` on the configured `APP_URL`, which checks against the official `adoptions` collection and displays a verified badge.
5. **Welfare Check-in Cadence:** The 1st of every month automatically initializes a `waiting` report for each active adoption. The 8th of every month automatically sends a follow-up reminder to anyone whose update remains pending.
