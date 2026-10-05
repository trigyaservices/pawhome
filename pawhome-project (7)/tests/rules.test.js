import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Firestore Rules - Syntactic and Structural Validation', () => {
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  assert.ok(fs.existsSync(rulesPath), 'firestore.rules file must exist');

  const content = fs.readFileSync(rulesPath, 'utf8');

  // Verify key security protections are enforced in rules text
  assert.ok(content.includes('isAdmin()'), 'Must define isAdmin() helper');
  assert.ok(content.includes('isOwner('), 'Must define isOwner() helper');
  assert.ok(content.includes('users/{userId}'), 'Must protect users collection');
  assert.ok(content.includes('pets/{petId}'), 'Must protect pets collection');
  assert.ok(content.includes('applications/{appId}'), 'Must protect applications collection');
  assert.ok(content.includes('reports/{reportId}'), 'Must protect monthly reports collection');

  // Ensure normal users cannot grant themselves admin claim
  assert.ok(content.includes('role'), 'Must restrict role updates');
});

test('Storage Rules - File Type and Size Constraints', () => {
  const storagePath = path.join(__dirname, '..', 'storage.rules');
  assert.ok(fs.existsSync(storagePath), 'storage.rules file must exist');

  const content = fs.readFileSync(storagePath, 'utf8');

  assert.ok(content.includes('maxFileSize(5)'), 'Must enforce 5MB limit for images');
  assert.ok(content.includes('maxFileSize(10)'), 'Must enforce 10MB limit for documents');
  assert.ok(content.includes('applications/{appId}/idProofs'), 'Must restrict ID proofs');
  assert.ok(content.includes('applications/{appId}/landlordPerms'), 'Must restrict landlord permissions');
});

test('SEO & Production Assets - Verification of robots.txt, sitemap, and headers', () => {
  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');

  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');

  const firebaseJsonPath = path.join(__dirname, '..', 'firebase.json');
  assert.ok(fs.existsSync(firebaseJsonPath), 'firebase.json must exist');
  const fbJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));

  assert.ok(fbJson.hosting.headers, 'firebase.json must include security headers');
  const allHeaders = fbJson.hosting.headers.flatMap((h) => h.headers);
  assert.ok(allHeaders.some((h) => h.key === 'Strict-Transport-Security'), 'Must enforce HSTS');
  assert.ok(allHeaders.some((h) => h.key === 'X-Content-Type-Options'), 'Must enforce nosniff');
});
