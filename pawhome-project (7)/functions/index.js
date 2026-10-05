const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { generateCertificatePdf } = require('./generateCertificate');
const {
  sendApplicationSubmittedEmail,
  sendAdminNewApplicationEmail,
  sendApplicationDecisionEmail,
  sendMonthlyReportDueEmail,
  sendReportReminderEmail
} = require('./emailService');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pawhome.org';

/**
 * 1. onApplicationCreate (Firestore Trigger)
 * Automatically marks pet as Reserved upon application submission.
 * Sends confirmation email to applicant and alert email to shelter admin.
 * Creates in-app notification.
 */
exports.onApplicationCreate = functions.firestore
  .document('applications/{appId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const appId = context.params.appId;
    const petId = data.petId;

    try {
      // Set Pet status to Reserved
      if (petId) {
        const petRef = db.collection('pets').doc(petId);
        await petRef.update({
          status: 'Reserved',
          activeApplicationId: appId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Add user in-app notification
      if (data.userId) {
        await db.collection('notifications').doc(data.userId).collection('items').add({
          title: `Application Submitted: ${data.petName || 'Pet'}`,
          body: 'We have received your adoption application and will review it within 2-3 business days.',
          link: '/account',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Dispatch applicant confirmation email
      if (data.userEmail) {
        await sendApplicationSubmittedEmail({
          to: data.userEmail,
          adopterName: data.fullName || 'Adopter',
          petName: data.petName || 'Pet',
          appId
        });
      }

      // Dispatch admin alert email
      await sendAdminNewApplicationEmail({
        adminEmail: ADMIN_EMAIL,
        applicantName: data.fullName || 'New Applicant',
        petName: data.petName || 'Pet',
        place: `${data.city || 'City'}, ${data.country || 'India'}`
      });

      console.log(`[onApplicationCreate] Processed application ${appId} for pet ${petId}`);
    } catch (err) {
      console.error(`[onApplicationCreate] Error processing application ${appId}:`, err);
    }
  });

/**
 * 2. decideApplication (Callable - Admin Only)
 * Handles approval or rejection of adoption applications.
 * If accepted: marks pet as Adopted, generates unique PDF certificate, uploads to Storage,
 * creates adoption record, sends celebratory email with certificate attached.
 * If rejected: requires reason, reverts pet to Available if no other pending apps, sends notification.
 */
exports.decideApplication = functions.https.onCall(async (data, context) => {
  // Verify Admin Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to decide applications.');
  }

  const userClaims = context.auth.token || {};
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const isAdmin = userClaims.role === 'admin' || (userDoc.exists && userDoc.data().role === 'admin');

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can approve or decline adoption applications.');
  }

  const { applicationId, decision, reason } = data;

  if (!applicationId || !['accept', 'reject'].includes(decision)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid applicationId and decision ("accept" or "reject") are required.');
  }

  if (decision === 'reject' && (!reason || !reason.trim())) {
    throw new functions.https.HttpsError('invalid-argument', 'A reason is required when rejecting an adoption application.');
  }

  const appRef = db.collection('applications').doc(applicationId);
  const appSnap = await appRef.get();

  if (!appSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Application document does not exist.');
  }

  const appData = appSnap.data();
  const petId = appData.petId;
  const userId = appData.userId;
  const petRef = db.collection('pets').doc(petId);
  const petSnap = await petRef.get();
  const petData = petSnap.exists ? petSnap.data() : {};

  const now = admin.firestore.FieldValue.serverTimestamp();

  if (decision === 'accept') {
    // Generate unique Certificate ID (e.g. PH-2026-XXXX)
    const currentYear = new Date().getFullYear();
    const certSuffix = Math.floor(1000 + Math.random() * 9000);
    const certificateId = `PH-${currentYear}-${certSuffix}`;

    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const verifyUrl = `${APP_URL}/verify/${certificateId}`;

    // Generate PDF Certificate
    const certificatePdfBuffer = await generateCertificatePdf({
      certificateId,
      adopterName: appData.fullName || 'Adopter',
      petName: appData.petName || petData.name || 'Pet',
      petBreed: petData.breed || 'Mixed Breed',
      petType: petData.type || 'dog',
      dateString: dateFormatted,
      city: appData.city || petData.city || 'Mumbai',
      country: appData.country || petData.country || 'India',
      verifyUrl
    });

    // Upload PDF to Firebase Storage
    const bucket = storage.bucket();
    const certStoragePath = `certificates/${certificateId}.pdf`;
    const certFile = bucket.file(certStoragePath);

    await certFile.save(certificatePdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          certificateId,
          applicationId,
          userId,
          petId
        }
      }
    });

    // Make file accessible or get signed URL
    let certificateUrl = '';
    try {
      const [signedUrl] = await certFile.getSignedUrl({
        action: 'read',
        expires: '03-01-2035'
      });
      certificateUrl = signedUrl;
    } catch (e) {
      certificateUrl = `https://storage.googleapis.com/${bucket.name}/${certStoragePath}`;
    }

    // Atomic Batch writes
    const batch = db.batch();

    // 1. Update Application
    batch.update(appRef, {
      status: 'accepted',
      certificateId,
      certificateUrl,
      decidedAt: now,
      decidedBy: context.auth.uid
    });

    // 2. Update Pet
    batch.update(petRef, {
      status: 'Adopted',
      adoptedBy: userId,
      adoptedAt: now,
      certificateId
    });

    // 3. Create Adoption document
    const adoptionRef = db.collection('adoptions').doc();
    batch.set(adoptionRef, {
      petId,
      petName: appData.petName || petData.name || 'Pet',
      petType: petData.type || 'dog',
      userId,
      adopterName: appData.fullName || 'Adopter',
      applicationId,
      certificateId,
      certificateUrl,
      adoptedAt: now,
      welfare: 'ok'
    });

    // 4. Create in-app notification
    const notifRef = db.collection('notifications').doc(userId).collection('items').doc();
    batch.set(notifRef, {
      title: `Adoption Approved: ${appData.petName || 'Pet'}! 🏆`,
      body: `Congratulations! Your adoption certificate (${certificateId}) is ready. Download it in My Account.`,
      link: '/account',
      read: false,
      createdAt: now
    });

    await batch.commit();

    // Send decision email with attached certificate PDF
    if (appData.userEmail) {
      await sendApplicationDecisionEmail({
        to: appData.userEmail,
        adopterName: appData.fullName || 'Adopter',
        petName: appData.petName || petData.name || 'Pet',
        decision: 'accept',
        certificateId,
        certificatePdfBuffer
      });
    }

    return {
      success: true,
      decision: 'accepted',
      certificateId,
      certificateUrl
    };
  } else {
    // Reject Branch
    const batch = db.batch();

    batch.update(appRef, {
      status: 'rejected',
      decisionReason: reason.trim(),
      decidedAt: now,
      decidedBy: context.auth.uid
    });

    // Check if other pending applications exist for this pet
    const pendingOtherAppsSnap = await db
      .collection('applications')
      .where('petId', '==', petId)
      .where('status', '==', 'pending')
      .get();

    // If no other pending applications, revert pet to Available
    if (pendingOtherAppsSnap.docs.filter((d) => d.id !== applicationId).length === 0) {
      batch.update(petRef, {
        status: 'Available',
        activeApplicationId: null,
        updatedAt: now
      });
    }

    // In-app notification
    const notifRef = db.collection('notifications').doc(userId).collection('items').doc();
    batch.set(notifRef, {
      title: `Update on your application for ${appData.petName || 'Pet'}`,
      body: `Your adoption application was reviewed. Reason: ${reason.trim()}`,
      link: '/account',
      read: false,
      createdAt: now
    });

    await batch.commit();

    // Send rejection email with reason
    if (appData.userEmail) {
      await sendApplicationDecisionEmail({
        to: appData.userEmail,
        adopterName: appData.fullName || 'Adopter',
        petName: appData.petName || petData.name || 'Pet',
        decision: 'reject',
        reason: reason.trim()
      });
    }

    return {
      success: true,
      decision: 'rejected'
    };
  }
});

/**
 * 3. monthlyReportScheduler (Scheduled - 1st of every month at 9:00 AM)
 * Initializes a reports document for every active adoption for the current month.
 * Notifies adopters via email & in-app notification.
 */
exports.monthlyReportScheduler = functions.pubsub
  .schedule('0 9 1 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[monthlyReportScheduler] Running monthly reports initialization for ${month}`);

    try {
      const adoptionsSnap = await db.collection('adoptions').get();
      if (adoptionsSnap.empty) {
        console.log('[monthlyReportScheduler] No active adoptions found.');
        return null;
      }

      for (const adoptDoc of adoptionsSnap.docs) {
        const adoption = adoptDoc.data();
        const adoptionId = adoptDoc.id;

        // Check if report document already exists
        const existingReportSnap = await db
          .collection('reports')
          .where('adoptionId', '==', adoptionId)
          .where('month', '==', month)
          .limit(1)
          .get();

        if (existingReportSnap.empty) {
          const reportRef = db.collection('reports').doc();
          await reportRef.set({
            adoptionId,
            userId: adoption.userId,
            petId: adoption.petId,
            petName: adoption.petName || 'Pet',
            adopterName: adoption.adopterName || 'Adopter',
            month,
            status: 'waiting',
            text: '',
            photoUrl: '',
            adminReply: '',
            welfare: 'ok',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // In-app notification
          if (adoption.userId) {
            await db.collection('notifications').doc(adoption.userId).collection('items').add({
              title: `${month} Welfare Update Due for ${adoption.petName || 'your pet'}`,
              body: 'Please share a quick photo and health note from your account dashboard.',
              link: '/account',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Fetch user email to dispatch notification
            const userSnap = await db.collection('users').doc(adoption.userId).get();
            if (userSnap.exists && userSnap.data().email) {
              await sendMonthlyReportDueEmail({
                to: userSnap.data().email,
                adopterName: adoption.adopterName || 'Adopter',
                petName: adoption.petName || 'Pet',
                month
              });
            }
          }
        }
      }
      console.log(`[monthlyReportScheduler] Successfully initialized monthly reports for ${month}`);
    } catch (err) {
      console.error('[monthlyReportScheduler] Error running scheduler:', err);
    }
    return null;
  });

/**
 * 4. reportReminderScheduler (Scheduled - 8th of every month at 9:00 AM)
 * Sends automated reminder email to adopters whose report is still in 'waiting' status.
 */
exports.reportReminderScheduler = functions.pubsub
  .schedule('0 9 8 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[reportReminderScheduler] Running reminder check for ${month}`);

    try {
      const pendingSnap = await db
        .collection('reports')
        .where('month', '==', month)
        .where('status', '==', 'waiting')
        .get();

      if (pendingSnap.empty) {
        console.log('[reportReminderScheduler] No pending reports awaiting reminders.');
        return null;
      }

      for (const rDoc of pendingSnap.docs) {
        const report = rDoc.data();
        if (report.userId) {
          const userSnap = await db.collection('users').doc(report.userId).get();
          if (userSnap.exists && userSnap.data().email) {
            await sendReportReminderEmail({
              to: userSnap.data().email,
              adopterName: report.adopterName || 'Adopter',
              petName: report.petName || 'Pet',
              month
            });
          }
        }
      }
      console.log(`[reportReminderScheduler] Sent ${pendingSnap.docs.length} automated reminders.`);
    } catch (err) {
      console.error('[reportReminderScheduler] Error running reminder scheduler:', err);
    }
    return null;
  });

/**
 * 5. sendReportReminder (Callable - Admin Only)
 * Allows shelter administrators to manually dispatch a friendly reminder for any waiting report.
 */
exports.sendReportReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to send reminders.');
  }

  const userClaims = context.auth.token || {};
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const isAdmin = userClaims.role === 'admin' || (userDoc.exists && userDoc.data().role === 'admin');

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin role required to trigger manual reminders.');
  }

  const { reportId } = data;
  if (!reportId) {
    throw new functions.https.HttpsError('invalid-argument', 'reportId is required.');
  }

  const reportRef = db.collection('reports').doc(reportId);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Report document not found.');
  }

  const report = reportSnap.data();

  if (report.userId) {
    const userSnap = await db.collection('users').doc(report.userId).get();
    if (userSnap.exists && userSnap.data().email) {
      await sendReportReminderEmail({
        to: userSnap.data().email,
        adopterName: report.adopterName || 'Adopter',
        petName: report.petName || 'Pet',
        month: report.month || 'Current Month'
      });
    }

    // In-app notification
    await db.collection('notifications').doc(report.userId).collection('items').add({
      title: `Reminder: ${report.month} update for ${report.petName || 'your pet'} is pending`,
      body: 'Please upload a photo and health note in My Account.',
      link: '/account',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return { success: true, message: 'Reminder sent to adopter' };
});

/**
 * 6. verifyCertificate (Public HTTPS Endpoint)
 * Returns minimal verifiable information for any certificate ID.
 */
exports.verifyCertificate = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  const certId = req.query.certId || req.path.replace('/', '');

  if (!certId) {
    res.status(400).json({ valid: false, error: 'Certificate ID parameter is required.' });
    return;
  }

  try {
    const snap = await db
      .collection('adoptions')
      .where('certificateId', '==', certId)
      .limit(1)
      .get();

    if (snap.empty) {
      res.status(404).json({ valid: false, message: 'Certificate ID could not be validated.' });
      return;
    }

    const adData = snap.docs[0].data();
    const petSnap = await db.collection('pets').doc(adData.petId).get();
    const petData = petSnap.exists ? petSnap.data() : {};

    res.status(200).json({
      valid: true,
      certificateId: adData.certificateId,
      adopterName: adData.adopterName || 'Verified Adopter',
      petName: adData.petName || petData.name,
      petType: petData.type,
      petBreed: petData.breed,
      date: adData.adoptedAt?.toDate ? adData.adoptedAt.toDate().toISOString() : null,
      city: petData.city,
      country: petData.country
    });
  } catch (err) {
    console.error('[verifyCertificate] Error validating certificate:', err);
    res.status(500).json({ valid: false, error: 'Internal verification error.' });
  }
});
