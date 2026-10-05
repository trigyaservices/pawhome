const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

/**
 * Generate a PDF certificate of adoption using pdf-lib and qrcode.
 * Matches Pawhome design tokens: Forest (#0F4C45), Marigold (#F2A900), Ink (#14312D).
 */
async function generateCertificatePdf({
  certificateId,
  adopterName,
  petName,
  petBreed,
  petType = 'companion pet',
  dateString,
  city = 'Mumbai',
  country = 'India',
  verifyUrl
}) {
  // Create a landscape PDF document (792 x 612 points = 11 x 8.5 in)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([792, 612]);
  const { width, height } = page.getSize();

  // Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Palette colors
  const forest = rgb(15 / 255, 76 / 255, 69 / 255); // #0F4C45
  const ink = rgb(20 / 255, 49 / 255, 45 / 255); // #14312D
  const marigold = rgb(242 / 255, 169 / 255, 0 / 255); // #F2A900
  const muted = rgb(86 / 255, 108 / 255, 102 / 255); // #566C66
  const mintBg = rgb(247 / 255, 251 / 255, 249 / 255);

  // Background tint
  page.drawRectangle({
    x: 15,
    y: 15,
    width: width - 30,
    height: height - 30,
    color: mintBg
  });

  // Outer decorative border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: forest,
    borderWidth: 3
  });

  // Inner thin border
  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: marigold,
    borderWidth: 1.5
  });

  // Top Badge / Header
  const orgText = 'PAWHOME PET ADOPTION NETWORK';
  const orgWidth = fontBold.widthOfTextAtSize(orgText, 12);
  page.drawText(orgText, {
    x: (width - orgWidth) / 2,
    y: height - 68,
    size: 12,
    font: fontBold,
    color: forest
  });

  // Main Title
  const titleText = 'CERTIFICATE OF ADOPTION';
  const titleWidth = fontTimesBold.widthOfTextAtSize(titleText, 32);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 110,
    size: 32,
    font: fontTimesBold,
    color: forest
  });

  // Subtitle / Certificate ID
  const certIdText = `Certificate Identification: ${certificateId}`;
  const certIdWidth = fontRegular.widthOfTextAtSize(certIdText, 11);
  page.drawText(certIdText, {
    x: (width - certIdWidth) / 2,
    y: height - 132,
    size: 11,
    font: fontRegular,
    color: muted
  });

  // Certifies text
  const certText = 'This is to officially certify that';
  const certWidth = fontItalic.widthOfTextAtSize(certText, 14);
  page.drawText(certText, {
    x: (width - certWidth) / 2,
    y: height - 180,
    size: 14,
    font: fontItalic,
    color: ink
  });

  // Adopter Name (Large & Bold)
  const nameWidth = fontTimesBold.widthOfTextAtSize(adopterName, 30);
  page.drawText(adopterName, {
    x: (width - nameWidth) / 2,
    y: height - 224,
    size: 30,
    font: fontTimesBold,
    color: forest
  });

  // Gold accent line under name
  page.drawLine({
    start: { x: (width - Math.max(nameWidth, 240)) / 2, y: height - 236 },
    end: { x: (width + Math.max(nameWidth, 240)) / 2, y: height - 236 },
    thickness: 1.5,
    color: marigold
  });

  // Adoption statement
  const stmt1 = 'has officially welcomed into their heart and home the beloved companion';
  const stmt1Width = fontRegular.widthOfTextAtSize(stmt1, 14);
  page.drawText(stmt1, {
    x: (width - stmt1Width) / 2,
    y: height - 275,
    size: 14,
    font: fontRegular,
    color: ink
  });

  // Pet Name & Breed
  const petHighlight = `${petName.toUpperCase()}`;
  const petDetails = `(${petBreed || 'Mixed Breed'} · ${petType})`;
  const fullPetStr = `${petHighlight} ${petDetails}`;
  const fullPetWidth = fontBold.widthOfTextAtSize(fullPetStr, 22);
  page.drawText(fullPetStr, {
    x: (width - fullPetWidth) / 2,
    y: height - 315,
    size: 22,
    font: fontBold,
    color: forest
  });

  // Commitment statement
  const pledgeText =
    'promising lifelong affection, ethical welfare, veterinary protection, and safe shelter.';
  const pledgeWidth = fontItalic.widthOfTextAtSize(pledgeText, 12);
  page.drawText(pledgeText, {
    x: (width - pledgeWidth) / 2,
    y: height - 355,
    size: 12,
    font: fontItalic,
    color: muted
  });

  // Date and Location Box
  const locText = `Issued on ${dateString || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · ${city}, ${country}`;
  const locWidth = fontRegular.widthOfTextAtSize(locText, 12);
  page.drawText(locText, {
    x: (width - locWidth) / 2,
    y: height - 390,
    size: 12,
    font: fontRegular,
    color: ink
  });

  // Embed QR Code for Public Verification
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 120,
      color: {
        dark: '#0F4C45',
        light: '#FFFFFF'
      }
    });
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    page.drawImage(qrImage, {
      x: 70,
      y: 65,
      width: 80,
      height: 80
    });

    page.drawText('Scan to verify registry', {
      x: 60,
      y: 50,
      size: 9,
      font: fontRegular,
      color: muted
    });
  } catch (err) {
    console.warn('QR code embedding failed, continuing with textual verification link:', err);
  }

  // Official Signature Block
  const sigLineStart = width - 260;
  const sigLineEnd = width - 70;
  page.drawLine({
    start: { x: sigLineStart, y: 105 },
    end: { x: sigLineEnd, y: 105 },
    thickness: 1,
    color: forest
  });

  const sigTitle = 'Pawhome Adoption Directorate';
  const sigTitleWidth = fontBold.widthOfTextAtSize(sigTitle, 12);
  page.drawText(sigTitle, {
    x: sigLineStart + (sigLineEnd - sigLineStart - sigTitleWidth) / 2,
    y: 88,
    size: 12,
    font: fontBold,
    color: forest
  });

  const sigSub = 'Authorized Verification Seal';
  const sigSubWidth = fontRegular.widthOfTextAtSize(sigSub, 10);
  page.drawText(sigSub, {
    x: sigLineStart + (sigLineEnd - sigLineStart - sigSubWidth) / 2,
    y: 72,
    size: 10,
    font: fontRegular,
    color: muted
  });

  // Return PDF buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generateCertificatePdf };
