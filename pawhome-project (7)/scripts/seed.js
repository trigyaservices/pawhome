#!/usr/bin/env node

/**
 * Pawhome - Database Seeding Script
 * Usage: node scripts/seed.js
 *
 * Populates Firestore with 8 diverse sample pets (India and international)
 * and essential platform settings for local development and testing.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`[Info] Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
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

const db = admin.firestore();

const SAMPLE_PETS = [
  {
    id: 'pet-bruno-mumbai',
    name: 'Bruno',
    type: 'dog',
    breed: 'Indie',
    ageText: '2 yrs',
    gender: 'male',
    size: 'medium',
    vaccinated: true,
    city: 'Mumbai',
    country: 'India',
    fee: '1500',
    currency: 'INR',
    status: 'Available',
    description: 'Rescued from Bandra streets. Calm, affectionate, loves gentle morning walks, and gets along wonderfully with other dogs and kids.'
  },
  {
    id: 'pet-mishti-pune',
    name: 'Mishti',
    type: 'cat',
    breed: 'Bengal mix',
    ageText: '1 yr',
    gender: 'female',
    size: 'small',
    vaccinated: true,
    city: 'Pune',
    country: 'India',
    fee: '1000',
    currency: 'INR',
    status: 'Adopted',
    description: 'Playful and curious young cat with beautiful rosette patterns. Fully litter-trained and microchipped. Found a loving forever home!'
  },
  {
    id: 'pet-luna-toronto',
    name: 'Luna',
    type: 'dog',
    breed: 'Labrador mix',
    ageText: '3 yrs',
    gender: 'female',
    size: 'large',
    vaccinated: true,
    city: 'Toronto',
    country: 'Canada',
    fee: '120',
    currency: 'CAD',
    status: 'Available',
    description: 'Golden-hearted lab mix surrendered due to family relocation. Crate-trained, housebroken, and loves swimming in lakeside parks.'
  },
  {
    id: 'pet-coco-berlin',
    name: 'Coco',
    type: 'rabbit',
    breed: 'Dutch',
    ageText: '8 months',
    gender: 'male',
    size: 'small',
    vaccinated: true,
    city: 'Berlin',
    country: 'Germany',
    fee: '60',
    currency: 'EUR',
    status: 'Available',
    description: 'Gentle, friendly black-and-white Dutch rabbit. Litter-trained and used to free-roaming living rooms. Loves fresh timothy hay and mint leaves.'
  },
  {
    id: 'pet-kiwi-delhi',
    name: 'Kiwi',
    type: 'bird',
    breed: 'Rose-ringed parakeet',
    ageText: '4 yrs',
    gender: 'male',
    size: 'small',
    vaccinated: true,
    city: 'Delhi',
    country: 'India',
    fee: '800',
    currency: 'INR',
    status: 'Available',
    description: 'Rescued with a healed wing injury. Sings melodic whistles in the morning and enjoys seed bells and fresh apple slices.'
  },
  {
    id: 'pet-oscar-london',
    name: 'Oscar',
    type: 'cat',
    breed: 'British shorthair',
    ageText: '5 yrs',
    gender: 'male',
    size: 'medium',
    vaccinated: true,
    city: 'London',
    country: 'United Kingdom',
    fee: '90',
    currency: 'GBP',
    status: 'Available',
    description: 'Placid, regal British shorthair with plush grey coat. Prefers quiet apartments, sunbathing on cushions, and purrs continuously.'
  },
  {
    id: 'pet-bella-bengaluru',
    name: 'Bella',
    type: 'dog',
    breed: 'Golden Retriever mix',
    ageText: '1.5 yrs',
    gender: 'female',
    size: 'medium',
    vaccinated: true,
    city: 'Bengaluru',
    country: 'India',
    fee: '2000',
    currency: 'INR',
    status: 'Available',
    description: 'High energy, joyful pup rescued from Koramangala. Knows basic commands (sit, paw, stay) and thrives with active families.'
  },
  {
    id: 'pet-milo-newyork',
    name: 'Milo',
    type: 'dog',
    breed: 'Beagle mix',
    ageText: '4 yrs',
    gender: 'male',
    size: 'medium',
    vaccinated: true,
    city: 'New York',
    country: 'United States',
    fee: '150',
    currency: 'USD',
    status: 'Available',
    description: 'Friendly hound dog rescued from an upstate shelter. Inquisitive nose, affectionate cuddler, and fantastic walking companion in urban neighborhoods.'
  }
];

const SITE_SETTINGS = {
  contactEmail: 'adoptions@pawhome.org',
  allowedCountries: 'India, Canada, Germany, United Kingdom, United States',
  allowedCurrencies: 'INR, USD, EUR, GBP, CAD',
  applicationReviewDays: 3,
  monthlyReportDay: 1,
  reminderDay: 8,
  emailTemplates: {
    applicationReceived: 'Thank you for applying to adopt from Pawhome. Your application is under review.',
    applicationAccepted: 'Congratulations! Your adoption application has been approved. Your official certificate is attached.',
    applicationRejected: 'Thank you for your interest. Unfortunately your application could not be approved at this time.'
  }
};

async function seed() {
  console.log('\n--- Seeding Pawhome Database ---');

  try {
    console.log(`\nSeeding ${SAMPLE_PETS.length} sample pets...`);
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const pet of SAMPLE_PETS) {
      const { id, ...data } = pet;
      const petRef = db.collection('pets').doc(id);
      await petRef.set(
        {
          ...data,
          photos: [],
          docs: [],
          createdBy: 'system-seed',
          createdAt: now,
          updatedAt: now
        },
        { merge: true }
      );
      console.log(`✓ Seeded pet: ${pet.name} (${pet.breed}, ${pet.city}, ${pet.country}) [${pet.status}]`);
    }

    console.log('\nSeeding platform site settings...');
    await db.collection('settings').doc('site').set(SITE_SETTINGS, { merge: true });
    console.log('✓ Seeded settings/site configuration');

    console.log('\n🎉 Database seeding completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
