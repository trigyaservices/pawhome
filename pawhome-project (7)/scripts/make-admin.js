#!/usr/bin/env node

/**
 * Pawhome - Admin Role Provisioning Script
 * Usage: node scripts/make-admin.js <email>
 *
 * Sets Firebase Auth custom claim { role: "admin" } on the target user
 * and updates their Firestore document in users/{uid}.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const email = process.argv[2];

if (!email) {
  console.error('\nError: Missing email argument.');
  console.error('Usage: node scripts/make-admin.js <email>\n');
  process.exit(1);
}

// Check if running against local Firebase Auth emulator
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log(`[Info] Connecting to Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
}

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      admin.initializeApp();
    }
  } else {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'pawhome-app'
    });
  }
}

async function grantAdminRole() {
  try {
    console.log(`\nLooking up user with email: ${email}...`);
    const user = await admin.auth().getUserByEmail(email);

    console.log(`Found user: ${user.uid} (${user.displayName || 'No display name'})`);

    // Set custom user claims
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'admin'
    });

    console.log(`✓ Set custom claim { role: "admin" } on user ${user.uid}`);

    // Update Firestore user document
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(user.uid);
    await userDocRef.set(
      {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    console.log(`✓ Updated Firestore document in users/${user.uid} with role: "admin"`);
    console.log(`\n🎉 Success! User ${email} is now an official Pawhome administrator.`);
    console.log(`Note: If the user is currently logged in, they should sign out and sign back in (or call refreshClaims()) for their new token claims to take effect.\n`);
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`\n❌ Error: No user found with email "${email}".`);
      console.error('The user must create an account first before you can make them an admin.\n');
    } else {
      console.error('\n❌ Failed to grant admin role:', err);
    }
    process.exit(1);
  }
}

grantAdminRole();
