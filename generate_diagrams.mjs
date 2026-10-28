import fs from 'fs';
import path from 'path';

// Helper to escape XML strings
function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\r?\n/g, '&#xa;');
}

function vertex(id, value, style, x, y, width, height, parent = '1') {
  return `<mxCell id="${id}" value="${escapeXml(value)}" style="${escapeXml(style)}" vertex="1" parent="${parent}">
          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />
        </mxCell>`;
}

function edge(id, value, style, source, target, points = [], parent = '1') {
  let ptsXml = '';
  if (points && points.length > 0) {
    ptsXml = `<Array as="points">\n` +
      points.map(p => `            <mxPoint x="${p.x}" y="${p.y}" />`).join('\n') +
      `\n          </Array>`;
  }
  return `<mxCell id="${id}" value="${escapeXml(value)}" style="${escapeXml(style)}" edge="1" parent="${parent}" source="${source}" target="${target}">
          <mxGeometry relative="1" as="geometry">
            ${ptsXml}
          </mxGeometry>
        </mxCell>`;
}

function edgeDirect(id, value, style, sourcePoint, targetPoint, points = [], parent = '1') {
  let ptsXml = '';
  if (points && points.length > 0) {
    ptsXml = `<Array as="points">\n` +
      points.map(p => `            <mxPoint x="${p.x}" y="${p.y}" />`).join('\n') +
      `\n          </Array>`;
  }
  return `<mxCell id="${id}" value="${escapeXml(value)}" style="${escapeXml(style)}" edge="1" parent="${parent}">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${sourcePoint.x}" y="${sourcePoint.y}" as="sourcePoint" />
            <mxPoint x="${targetPoint.x}" y="${targetPoint.y}" as="targetPoint" />
            ${ptsXml}
          </mxGeometry>
        </mxCell>`;
}

// -------------------------------------------------------------
// 1. COMMUNICATION DIAGRAM
// -------------------------------------------------------------
function buildCommunicationDiagram() {
  const cells = [];
  let idCounter = 100;
  const nextId = () => `c_${idCounter++}`;

  // Title Banner
  cells.push(vertex(nextId(), 'CineMoments — UML 2.x Communication Diagram (Interval Booking & Atomic Resolution)', 
    'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#1e293b;strokeColor=#3b82f6;fontColor=#ffffff;fontStyle=1;fontSize=15;size=15;', 
    40, 20, 750, 45));

  // Legend box
  cells.push(vertex(nextId(), 'Legend:\n• Numbering: [Step: MethodCall(args)]\n• Blue = Customer Order Flow (1 - 16)\n• Crimson = Staff Review & Atomic Resolution (17 - 28)\n• Green = Automated Expiration (E1 - E2)', 
    'rounded=1;whiteSpace=wrap;html=1;fillColor=#0f172a;strokeColor=#475569;fontColor=#94a3b8;fontSize=11;align=left;spacing=8;', 
    820, 15, 480, 55));

  // Objects / Lifelines
  // Actors
  const custActor = nextId();
  cells.push(vertex(custActor, 'Customer\n(Actor)', 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#3b82f6;strokeColor=#1d4ed8;fontStyle=1;', 60, 200, 60, 90));

  const staffActor = nextId();
  cells.push(vertex(staffActor, 'Theatre Staff\n(Actor)', 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#ef4444;strokeColor=#b91c1c;fontStyle=1;', 60, 640, 60, 90));

  // Boundaries (Frontend)
  const bookWizard = nextId();
  cells.push(vertex(bookWizard, ':BookingWizardUI\n(React 18 Frontend)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;fontSize=12;', 220, 215, 160, 60));

  const staffDash = nextId();
  cells.push(vertex(staffDash, ':StaffDashboardUI\n(React 18 Frontend)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontStyle=1;fontSize=12;', 220, 655, 160, 60));

  // Middlewares & Controller
  const authMid = nextId();
  cells.push(vertex(authMid, ':AuthMiddleware\n(JWT & Role Guard)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontStyle=1;fontSize=12;', 470, 90, 160, 55));

  const bookCtrl = nextId();
  cells.push(vertex(bookCtrl, ':BookingController\n(Express Route Handler)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ede9fe;strokeColor=#7c3aed;fontStyle=1;fontSize=12;', 470, 215, 170, 60));

  // Core Service
  const bookSrv = nextId();
  cells.push(vertex(bookSrv, ':BookingService\n(Core Business Logic)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fef08a;strokeColor=#ca8a04;fontStyle=1;fontSize=12;', 730, 215, 170, 60));

  // Crypto Service & Encrypted Storage
  const cryptoSrv = nextId();
  cells.push(vertex(cryptoSrv, ':CryptoService\n(AES-256-GCM / MagicBytes)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#e0e7ff;strokeColor=#4338ca;fontStyle=1;fontSize=12;', 990, 90, 180, 55));

  const encStorage = nextId();
  cells.push(vertex(encStorage, ':EncryptedStorage\n(Private /uploads/*.enc)', 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#fed7aa;strokeColor=#ea580c;fontStyle=1;fontSize=11;', 1230, 85, 140, 65));

  // Database Engine
  const dbSync = nextId();
  cells.push(vertex(dbSync, ':DatabaseSync\n(SQLite WAL + Unique Index)', 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;fontSize=12;', 730, 440, 180, 75));

  // Notification Service & Audit Service
  const notifSrv = nextId();
  cells.push(vertex(notifSrv, ':NotificationService\n(In-App Alerts)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ccfbf1;strokeColor=#0f766e;fontStyle=1;fontSize=12;', 990, 310, 170, 55));

  const auditSrv = nextId();
  cells.push(vertex(auditSrv, ':AuditService\n(Security Audit Logs)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffedd5;strokeColor=#c2410c;fontStyle=1;fontSize=12;', 990, 450, 170, 55));

  // Expiration Worker
  const expWorker = nextId();
  cells.push(vertex(expWorker, ':ExpirationWorker\n(60s Cron Worker)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e8ff;strokeColor=#9333ea;fontStyle=1;fontSize=12;', 470, 450, 170, 55));

  // Links & Message Arrows
  // 1. Customer <--> BookingWizard
  cells.push(edge(nextId(), '1: selectShowAndInterval()\n2: submitBooking(data, media) ➔\n\n 16: confirmationCard ↵', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#2563eb;fontColor=#1d4ed8;fontSize=10;labelBackgroundColor=#ffffff;', custActor, bookWizard));

  // 2. BookingWizard <--> BookingController
  cells.push(edge(nextId(), '3: POST /api/bookings ➔\n\n 15: 201 Created(bookingId) ↵', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#2563eb;fontColor=#1d4ed8;fontSize=10;labelBackgroundColor=#ffffff;', bookWizard, bookCtrl));

  // 3. BookingController <--> AuthMiddleware
  cells.push(edge(nextId(), '3.1: verifyToken() ➔\n 3.2: userPayload ↵', 
    'endArrow=none;html=1;strokeWidth=1;dashed=1;strokeColor=#64748b;fontColor=#475569;fontSize=10;labelBackgroundColor=#ffffff;', bookCtrl, authMid));

  // 4. BookingController <--> BookingService
  cells.push(edge(nextId(), '4: createBooking(inputPayload) ➔\n 14: return { bookingId } ↵\n\n 20: acceptBooking(bookingId) ➔\n 28: return { status: ACCEPTED } ↵', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#475569;fontColor=#334155;fontSize=10;labelBackgroundColor=#ffffff;', bookCtrl, bookSrv));

  // 5. BookingService <--> CryptoService
  cells.push(edge(nextId(), '5: validateMediaBuffer() ➔\n6: encryptBuffer(AES-256) ➔\n 7: { iv, authTag, encBuf } ↵', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#4338ca;fontColor=#3730a3;fontSize=10;labelBackgroundColor=#ffffff;', bookSrv, cryptoSrv));

  // 6. CryptoService <--> EncryptedStorage
  cells.push(edge(nextId(), '8: writeFileSync(uuid.enc) ➔', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#ea580c;fontColor=#c2410c;fontSize=10;labelBackgroundColor=#ffffff;', cryptoSrv, encStorage));

  // 7. BookingService <--> DatabaseSync
  cells.push(edge(nextId(), '9: verifyShowAndSlot() ➔\n10: checkWalletBalance() ➔\n11: deductWalletAndSplitRevenue() ➔\n12: insertBooking(PENDING) ➔\n13: insertBookingMedia() ➔\n\n21: BEGIN IMMEDIATE (Exclusive Lock) ➔\n22: checkDoubleBooking(showId) ➔\n23: UPDATE status = ACCEPTED ➔\n24: UPDATE competing = EXPIRED ➔\n25: refundCompetingWallets() ➔\n27: COMMIT ➔', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;labelBackgroundColor=#ffffff;', bookSrv, dbSync));

  // 8. BookingService <--> NotificationService
  cells.push(edge(nextId(), '26a: notifyAccepted(userId) ➔\n26b: notifyExpired(competingIds) ➔', 
    'endArrow=none;html=1;strokeWidth=1.5;strokeColor=#0f766e;fontColor=#0f766e;fontSize=10;labelBackgroundColor=#ffffff;', bookSrv, notifSrv));

  // 9. BookingService <--> AuditService
  cells.push(edge(nextId(), '13a: recordAuditLog(CREATE) ➔\n26c: recordAuditLog(ACCEPT) ➔', 
    'endArrow=none;html=1;strokeWidth=1.5;strokeColor=#c2410c;fontColor=#9a3412;fontSize=10;labelBackgroundColor=#ffffff;', bookSrv, auditSrv));

  // 10. TheatreStaff <--> StaffDashboard
  cells.push(edge(nextId(), '17: reviewRequests() ➔\n18: clickAccept(bookingId) ➔\n\n 29: displaySuccess() ↵', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;labelBackgroundColor=#ffffff;', staffActor, staffDash));

  // 11. StaffDashboard <--> BookingController
  cells.push(edge(nextId(), '19: POST /api/bookings/:id/accept ➔\n\n 28a: 200 OK(Accepted) ↵', 
    'endArrow=none;html=1;strokeWidth=2;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;labelBackgroundColor=#ffffff;', staffDash, bookCtrl, [{x: 400, y: 550}]));

  // 12. ExpirationWorker <--> DatabaseSync
  cells.push(edge(nextId(), 'E1: queryPendingOverdueShows() ➔\nE2: expireAndRefundOverdue() ➔', 
    'endArrow=none;html=1;strokeWidth=1.5;strokeColor=#9333ea;fontColor=#7e22ce;fontSize=10;labelBackgroundColor=#ffffff;', expWorker, dbSync));

  return { id: 'comm_diag', name: 'Communication Diagram', pageWidth: 1450, pageHeight: 850, cells };
}

// -------------------------------------------------------------
// 2. SEQUENCE DIAGRAM
// -------------------------------------------------------------
function buildSequenceDiagram() {
  const cells = [];
  let idCounter = 200;
  const nextId = () => `s_${idCounter++}`;

  // Title Banner
  cells.push(vertex(nextId(), 'CineMoments — UML Sequence Diagram (Interval Booking, Media Encryption & Atomic Acceptance)', 
    'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#1e293b;strokeColor=#3b82f6;fontColor=#ffffff;fontStyle=1;fontSize=15;size=15;', 
    40, 15, 820, 45));

  // Lifelines
  const actors = [
    { name: 'c:Customer\n(Actor)', x: 60, fill: '#3b82f6', stroke: '#1d4ed8', isActor: true },
    { name: 'ui:BookingWizard\n(Frontend)', x: 190, fill: '#dbeafe', stroke: '#2563eb' },
    { name: 'ctrl:BookingCtrl\n(Express API)', x: 340, fill: '#ede9fe', stroke: '#7c3aed' },
    { name: 'srv:BookingService\n(Business Logic)', x: 490, fill: '#fef08a', stroke: '#ca8a04' },
    { name: 'crypto:CryptoService\n(AES-256-GCM)', x: 650, fill: '#e0e7ff', stroke: '#4338ca' },
    { name: 'db:DatabaseSync\n(SQLite Engine)', x: 800, fill: '#dcfce7', stroke: '#16a34a' },
    { name: 'staff:TheatreStaff\n(Actor)', x: 960, fill: '#ef4444', stroke: '#b91c1c', isActor: true },
    { name: 'dash:StaffDashboard\n(Frontend)', x: 1090, fill: '#fee2e2', stroke: '#dc2626' },
    { name: 'notif:NotifService\n(In-App)', x: 1230, fill: '#ccfbf1', stroke: '#0f766e' }
  ];

  const bottomY = 1250;
  const colX = {};

  actors.forEach((act, idx) => {
    const actId = nextId();
    colX[idx] = act.x + 40; // center X
    // Header box
    cells.push(vertex(actId, act.name, 
      act.isActor 
        ? `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=${act.fill};strokeColor=${act.stroke};fontStyle=1;` 
        : `rounded=0;whiteSpace=wrap;html=1;fillColor=${act.fill};strokeColor=${act.stroke};fontStyle=1;fontSize=11;`, 
      act.x, 80, act.isActor ? 40 : 100, act.isActor ? 65 : 45));

    // Vertical dashed lifeline
    cells.push(edgeDirect(nextId(), '', 'endArrow=none;dashed=1;html=1;strokeWidth=1;strokeColor=#94a3b8;', 
      { x: colX[idx], y: 155 }, { x: colX[idx], y: bottomY }));
  });

  // Section 1 Header: Booking Creation & Media Encryption
  cells.push(vertex(nextId(), 'PHASE 1: INTERVAL BOOKING SUBMISSION & AES-256-GCM ENCRYPTED STORAGE', 
    'rounded=1;whiteSpace=wrap;html=1;fillColor=#2563eb;strokeColor=#1d4ed8;fontColor=#ffffff;fontStyle=1;fontSize=11;', 50, 165, 860, 26));

  // Sequence Step 1: Customer submits
  cells.push(edgeDirect(nextId(), '1. submitBooking(showId, msg, mediaFile)', 'endArrow=block;html=1;strokeColor=#2563eb;fontColor=#1d4ed8;fontSize=10;', 
    { x: colX[0], y: 210 }, { x: colX[1], y: 210 }));

  // Step 2: UI calls API
  cells.push(edgeDirect(nextId(), '2. POST /api/bookings (multipart/form-data)', 'endArrow=block;html=1;strokeColor=#2563eb;fontColor=#1d4ed8;fontSize=10;', 
    { x: colX[1], y: 240 }, { x: colX[2], y: 240 }));

  // Step 3: Controller delegates to Service
  cells.push(edgeDirect(nextId(), '3. createBooking(inputPayload)', 'endArrow=block;html=1;strokeColor=#7c3aed;fontColor=#6d28d9;fontSize=10;', 
    { x: colX[2], y: 270 }, { x: colX[3], y: 270 }));

  // Step 4: Service checks show
  cells.push(edgeDirect(nextId(), '4. SELECT s.*, price, owner_id WHERE id = showId', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 300 }, { x: colX[5], y: 300 }));

  cells.push(edgeDirect(nextId(), 'show details (Price = ₹500)', 'endArrow=open;dashed=1;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[5], y: 325 }, { x: colX[3], y: 325 }));

  // Step 5: Check wallet balance
  cells.push(edgeDirect(nextId(), '5. SELECT wallet_balance FROM users WHERE id = userId', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 350 }, { x: colX[5], y: 350 }));

  cells.push(edgeDirect(nextId(), 'wallet_balance = ₹2000.00', 'endArrow=open;dashed=1;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[5], y: 375 }, { x: colX[3], y: 375 }));

  // Step 6: Crypto Magic Bytes Inspection
  cells.push(edgeDirect(nextId(), '6. validateMediaBuffer(buffer, originalname)', 'endArrow=block;html=1;strokeColor=#4338ca;fontColor=#3730a3;fontSize=10;', 
    { x: colX[3], y: 405 }, { x: colX[4], y: 405 }));

  cells.push(edgeDirect(nextId(), 'validated (magic bytes OK: image/jpeg)', 'endArrow=open;dashed=1;html=1;strokeColor=#4338ca;fontColor=#3730a3;fontSize=10;', 
    { x: colX[4], y: 430 }, { x: colX[3], y: 430 }));

  // Step 7: Crypto AES-256-GCM Encryption
  cells.push(edgeDirect(nextId(), '7. encryptBuffer(buffer) [12-byte IV + Auth Tag]', 'endArrow=block;html=1;strokeColor=#4338ca;fontColor=#3730a3;fontSize=10;', 
    { x: colX[3], y: 455 }, { x: colX[4], y: 455 }));

  cells.push(edgeDirect(nextId(), '{ ivHex, authTagHex, encryptedBuffer }', 'endArrow=open;dashed=1;html=1;strokeColor=#4338ca;fontColor=#3730a3;fontSize=10;', 
    { x: colX[4], y: 480 }, { x: colX[3], y: 480 }));

  // Step 8: Debit wallet & split
  cells.push(edgeDirect(nextId(), '8. UPDATE wallet (User -₹500, Theatre +₹400 [80%], Admin +₹100 [20%])', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 510 }, { x: colX[5], y: 510 }));

  // Step 9: Insert Booking & Media
  cells.push(edgeDirect(nextId(), '9. INSERT INTO interval_bookings (status="PENDING") & media', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 540 }, { x: colX[5], y: 540 }));

  cells.push(edgeDirect(nextId(), 'bookingId = 101', 'endArrow=open;dashed=1;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[5], y: 565 }, { x: colX[3], y: 565 }));

  // Step 10: Returns to customer
  cells.push(edgeDirect(nextId(), '10. return { bookingId: 101 }', 'endArrow=open;dashed=1;html=1;strokeColor=#7c3aed;fontColor=#6d28d9;fontSize=10;', 
    { x: colX[3], y: 590 }, { x: colX[2], y: 590 }));

  cells.push(edgeDirect(nextId(), '11. 201 Created (Booking Pending Moderation)', 'endArrow=open;dashed=1;html=1;strokeColor=#2563eb;fontColor=#1d4ed8;fontSize=10;', 
    { x: colX[2], y: 615 }, { x: colX[1], y: 615 }));

  cells.push(edgeDirect(nextId(), '12. Show Confirmation & Live Screen Mockup', 'endArrow=open;dashed=1;html=1;strokeColor=#2563eb;fontColor=#1d4ed8;fontSize=10;', 
    { x: colX[1], y: 640 }, { x: colX[0], y: 640 }));

  // Section 2 Header: Moderation & Atomic Double-Booking Prevention
  cells.push(vertex(nextId(), 'PHASE 2: STAFF MODERATION, ATOMIC CONCURRENCY LOCK & COMPETING EXSPIRATION', 
    'rounded=1;whiteSpace=wrap;html=1;fillColor=#dc2626;strokeColor=#b91c1c;fontColor=#ffffff;fontStyle=1;fontSize=11;', 50, 680, 1260, 26));

  // Staff Reviews queue
  cells.push(edgeDirect(nextId(), '13. viewPendingBookings()', 'endArrow=block;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[6], y: 720 }, { x: colX[7], y: 720 }));

  cells.push(edgeDirect(nextId(), '14. GET /api/bookings/theatre/:id', 'endArrow=block;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[7], y: 745 }, { x: colX[2], y: 745 }));

  cells.push(edgeDirect(nextId(), 'pending requests list [Req #101, Req #102]', 'endArrow=open;dashed=1;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[2], y: 770 }, { x: colX[7], y: 770 }));

  // Staff clicks Accept
  cells.push(edgeDirect(nextId(), '15. click "Accept Booking"(id=101)', 'endArrow=block;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[6], y: 800 }, { x: colX[7], y: 800 }));

  cells.push(edgeDirect(nextId(), '16. POST /api/bookings/101/accept', 'endArrow=block;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[7], y: 825 }, { x: colX[2], y: 825 }));

  cells.push(edgeDirect(nextId(), '17. acceptBooking(101, staffUserId)', 'endArrow=block;html=1;strokeColor=#7c3aed;fontColor=#6d28d9;fontSize=10;', 
    { x: colX[2], y: 850 }, { x: colX[3], y: 850 }));

  // Critical Atomic Transaction BEGIN IMMEDIATE
  cells.push(edgeDirect(nextId(), '18. runTransaction() ➔ BEGIN IMMEDIATE; (Acquires Exclusive Lock)', 'endArrow=block;html=1;strokeWidth=2;strokeColor=#b91c1c;fontColor=#b91c1c;fontStyle=1;fontSize=10;', 
    { x: colX[3], y: 880 }, { x: colX[5], y: 880 }));

  // Verification
  cells.push(edgeDirect(nextId(), '19. SELECT id FROM interval_bookings WHERE show_id=show_id AND status="ACCEPTED"', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 910 }, { x: colX[5], y: 910 }));

  cells.push(edgeDirect(nextId(), 'No existing accepted row (Clear to proceed)', 'endArrow=open;dashed=1;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[5], y: 935 }, { x: colX[3], y: 935 }));

  // Alt frame for conflict vs success
  cells.push(vertex(nextId(), 'alt [Concurrency Conflict Check]', 
    'shape=umlFrame;whiteSpace=wrap;html=1;width=160;height=20;fillColor=none;strokeColor=#64748b;fontStyle=1;fontSize=10;', 450, 960, 860, 240));

  // Within Alt: Update to ACCEPTED
  cells.push(edgeDirect(nextId(), '20. UPDATE interval_bookings SET status="ACCEPTED", accepted_at=NOW WHERE id=101', 'endArrow=block;html=1;strokeWidth=2;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 990 }, { x: colX[5], y: 990 }));

  // Invalidate competing
  cells.push(edgeDirect(nextId(), '21. UPDATE interval_bookings SET status="EXPIRED" WHERE show_id=show_id AND id!=101', 'endArrow=block;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[3], y: 1020 }, { x: colX[5], y: 1020 }));

  // Refund competing
  cells.push(edgeDirect(nextId(), '22. refundBookingTransaction(competingRequests) [Re-credit user wallet]', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', 
    { x: colX[3], y: 1050 }, { x: colX[5], y: 1050 }));

  // COMMIT
  cells.push(edgeDirect(nextId(), '23. COMMIT; (Release DB Lock)', 'endArrow=block;html=1;strokeWidth=2;strokeColor=#16a34a;fontColor=#15803d;fontStyle=1;fontSize=10;', 
    { x: colX[3], y: 1080 }, { x: colX[5], y: 1080 }));

  // Notifications
  cells.push(edgeDirect(nextId(), '24. createNotification(acceptedUserId, "Booking Accepted! 🎉")', 'endArrow=block;html=1;strokeColor=#0f766e;fontColor=#0f766e;fontSize=10;', 
    { x: colX[3], y: 1110 }, { x: colX[8], y: 1110 }));

  cells.push(edgeDirect(nextId(), '25. createNotification(competingUserId, "Expired & Refunded")', 'endArrow=block;html=1;strokeColor=#0f766e;fontColor=#0f766e;fontSize=10;', 
    { x: colX[3], y: 1135 }, { x: colX[8], y: 1135 }));

  // Final Response
  cells.push(edgeDirect(nextId(), '26. return { success: true, status: "ACCEPTED", expiredCount: 1 }', 'endArrow=open;dashed=1;html=1;strokeColor=#7c3aed;fontColor=#6d28d9;fontSize=10;', 
    { x: colX[3], y: 1165 }, { x: colX[2], y: 1165 }));

  cells.push(edgeDirect(nextId(), '27. 200 OK (Accepted)', 'endArrow=open;dashed=1;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[2], y: 1190 }, { x: colX[7], y: 1190 }));

  cells.push(edgeDirect(nextId(), '28. Display Acceptance Banner', 'endArrow=open;dashed=1;html=1;strokeColor=#dc2626;fontColor=#b91c1c;fontSize=10;', 
    { x: colX[7], y: 1215 }, { x: colX[6], y: 1215 }));

  return { id: 'seq_diag', name: 'Sequence Diagram', pageWidth: 1400, pageHeight: 1350, cells };
}

// -------------------------------------------------------------
// 3. ACTIVITY DIAGRAM
// -------------------------------------------------------------
function buildActivityDiagram() {
  const cells = [];
  let idCounter = 300;
  const nextId = () => `a_${idCounter++}`;

  // Title
  cells.push(vertex(nextId(), 'CineMoments — UML 2.x Activity Diagram (Interval Booking, Media Ingestion, Auto-Expiration & Concurrency Safe Approval)', 
    'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#1e293b;strokeColor=#3b82f6;fontColor=#ffffff;fontStyle=1;fontSize=15;size=15;', 
    40, 15, 950, 45));

  // Swimlanes
  const lane1 = nextId();
  cells.push(vertex(lane1, 'Customer (Guest)', 
    'swimlane;startSize=30;horizontal=1;fontStyle=1;fontSize=13;fillColor=#eff6ff;strokeColor=#3b82f6;collapsible=0;', 40, 70, 360, 1180));

  const lane2 = nextId();
  cells.push(vertex(lane2, 'CineMoments System (Backend API & Database Engine)', 
    'swimlane;startSize=30;horizontal=1;fontStyle=1;fontSize=13;fillColor=#f8fafc;strokeColor=#64748b;collapsible=0;', 400, 70, 480, 1180));

  const lane3 = nextId();
  cells.push(vertex(lane3, 'Theatre Staff & Automation Worker', 
    'swimlane;startSize=30;horizontal=1;fontStyle=1;fontSize=13;fillColor=#fef2f2;strokeColor=#ef4444;collapsible=0;', 880, 70, 420, 1180));

  // Lane 1: Customer Actions
  const initNode = nextId();
  cells.push(vertex(initNode, '', 'ellipse;fillColor=#000000;strokeColor=#000000;', 200, 120, 30, 30));

  const actSelectShow = nextId();
  cells.push(vertex(actSelectShow, 'Browse Theatres,\nSelect Movie & Show Time', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;', 120, 180, 190, 50));

  const actFillDetails = nextId();
  cells.push(vertex(actFillDetails, 'Enter Big-Screen Message\n& Choose Booking Purpose', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;', 120, 260, 190, 50));

  const actUploadMedia = nextId();
  cells.push(vertex(actUploadMedia, 'Upload Proposal Media\n(Photo / Video File)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;', 120, 340, 190, 50));

  // Lane 2: System Processing
  const decValidMagic = nextId();
  cells.push(vertex(decValidMagic, 'Valid Magic\nBytes?', 'rhombus;whiteSpace=wrap;html=1;fillColor=#e2e8f0;strokeColor=#475569;fontStyle=1;', 580, 335, 120, 60));

  const actEncrypt = nextId();
  cells.push(vertex(actEncrypt, 'AES-256-GCM Encrypt File\n(Generate IV + Auth Tag)\nSave to /uploads/*.enc', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#e0e7ff;strokeColor=#4338ca;fontStyle=1;', 535, 430, 210, 55));

  const decWallet = nextId();
  cells.push(vertex(decWallet, 'Wallet Balance\n>= Fee?', 'rhombus;whiteSpace=wrap;html=1;fillColor=#e2e8f0;strokeColor=#475569;fontStyle=1;', 580, 515, 120, 60));

  const actDeductSplit = nextId();
  cells.push(vertex(actDeductSplit, 'Deduct User Wallet Balance\nCredit 80% Theatre Owner\nCredit 20% Super Admin', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;', 535, 605, 210, 55));

  const actInsertPending = nextId();
  cells.push(vertex(actInsertPending, 'Insert Booking Request\n(Status = "PENDING")', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;', 545, 690, 190, 50));

  // Lane 3: Staff & Automation
  const actStaffReview = nextId();
  cells.push(vertex(actStaffReview, 'Staff Reviews Request Queue\n& Decrypted Media Preview', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontStyle=1;', 980, 690, 220, 50));

  const decStaffChoice = nextId();
  cells.push(vertex(decStaffChoice, 'Staff\nDecision?', 'rhombus;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontStyle=1;', 1030, 775, 120, 60));

  // Reject Branch
  const actReject = nextId();
  cells.push(vertex(actReject, 'Mark Status "REJECTED"\nRefund Amount to Wallet\nDispatch Notification', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fecaca;strokeColor=#ef4444;fontStyle=1;', 1140, 865, 150, 60));

  // Accept Branch
  const actBeginTx = nextId();
  cells.push(vertex(actBeginTx, 'BEGIN IMMEDIATE;\n(Acquire Exclusive DB Lock)', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontStyle=1;', 900, 865, 190, 50));

  const decCheckDouble = nextId();
  cells.push(vertex(decCheckDouble, 'Slot Already\nAccepted?', 'rhombus;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontStyle=1;', 935, 945, 120, 60));

  const actRollbackConflict = nextId();
  cells.push(vertex(actRollbackConflict, 'ROLLBACK Transaction\nThrow 409 Conflict', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fecaca;strokeColor=#ef4444;fontStyle=1;', 1100, 950, 160, 50));

  // Fork Bar for parallel resolution
  const forkBar = nextId();
  cells.push(vertex(forkBar, '', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;', 480, 1040, 520, 8));

  // Parallel Actions
  const actAcceptThis = nextId();
  cells.push(vertex(actAcceptThis, 'Update Target Booking\nto "ACCEPTED"', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;', 430, 1070, 170, 45));

  const actExpireCompeting = nextId();
  cells.push(vertex(actExpireCompeting, 'Update Competing\nRequests to "EXPIRED"', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fef08a;strokeColor=#ca8a04;fontStyle=1;', 620, 1070, 160, 45));

  const actRefundCompeting = nextId();
  cells.push(vertex(actRefundCompeting, 'Refund Full Amount to\nCompeting Users\' Wallets', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;', 800, 1070, 170, 45));

  // Join Bar
  const joinBar = nextId();
  cells.push(vertex(joinBar, '', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;', 480, 1140, 520, 8));

  const actCommit = nextId();
  cells.push(vertex(actCommit, 'COMMIT Transaction\nDispatch Notifications\nLog Immutable Audit Trail', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;', 640, 1170, 200, 55));

  // Final nodes
  const endNodeSuccess = nextId();
  cells.push(vertex(endNodeSuccess, '', 'ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#16a34a;strokeWidth=3;', 725, 1245, 30, 30));

  const endNodeReject = nextId();
  cells.push(vertex(endNodeReject, '', 'ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#ef4444;strokeWidth=3;', 1200, 955, 30, 30));

  // Edges connecting nodes
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#2563eb;', initNode, actSelectShow));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#2563eb;', actSelectShow, actFillDetails));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#2563eb;', actFillDetails, actUploadMedia));
  cells.push(edge(nextId(), 'Multipart stream', 'endArrow=block;html=1;strokeColor=#2563eb;', actUploadMedia, decValidMagic));

  cells.push(edge(nextId(), 'No [Corrupt / Executable]', 'endArrow=block;html=1;strokeColor=#ef4444;fontColor=#ef4444;fontSize=10;', decValidMagic, actUploadMedia, [{x: 640, y: 310}, {x: 215, y: 310}]));
  cells.push(edge(nextId(), 'Yes [Valid Magic Bytes]', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', decValidMagic, actEncrypt));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#4338ca;', actEncrypt, decWallet));

  // Wallet recharge loop
  cells.push(edge(nextId(), 'No [Insufficient]', 'endArrow=block;html=1;strokeColor=#ef4444;fontColor=#ef4444;fontSize=10;', decWallet, actFillDetails, [{x: 480, y: 545}, {x: 480, y: 285}]));
  cells.push(edge(nextId(), 'Yes [Sufficient]', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', decWallet, actDeductSplit));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', actDeductSplit, actInsertPending));
  cells.push(edge(nextId(), 'Queued for Review', 'endArrow=block;html=1;strokeColor=#64748b;', actInsertPending, actStaffReview));

  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#dc2626;', actStaffReview, decStaffChoice));
  cells.push(edge(nextId(), '[Reject]', 'endArrow=block;html=1;strokeColor=#ef4444;fontColor=#ef4444;fontSize=10;', decStaffChoice, actReject));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#ef4444;', actReject, endNodeReject));

  cells.push(edge(nextId(), '[Accept]', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', decStaffChoice, actBeginTx));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#dc2626;', actBeginTx, decCheckDouble));
  cells.push(edge(nextId(), 'Yes [Collision]', 'endArrow=block;html=1;strokeColor=#ef4444;fontColor=#ef4444;fontSize=10;', decCheckDouble, actRollbackConflict));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#ef4444;', actRollbackConflict, endNodeReject));

  cells.push(edge(nextId(), 'No [Slot Free]', 'endArrow=block;html=1;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;', decCheckDouble, forkBar, [{x: 995, y: 1025}, {x: 740, y: 1025}]));

  // Out of Fork
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', forkBar, actAcceptThis, [{x: 515, y: 1055}]));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#ca8a04;', forkBar, actExpireCompeting, [{x: 700, y: 1055}]));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', forkBar, actRefundCompeting, [{x: 885, y: 1055}]));

  // Into Join
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', actAcceptThis, joinBar, [{x: 515, y: 1125}]));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#ca8a04;', actExpireCompeting, joinBar, [{x: 700, y: 1125}]));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', actRefundCompeting, joinBar, [{x: 885, y: 1125}]));

  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', joinBar, actCommit));
  cells.push(edge(nextId(), '', 'endArrow=block;html=1;strokeColor=#16a34a;', actCommit, endNodeSuccess));

  return { id: 'act_diag', name: 'Activity Diagram', pageWidth: 1350, pageHeight: 1300, cells };
}

// -------------------------------------------------------------
// 4. CLASS DIAGRAM
// -------------------------------------------------------------
function buildClassDiagram() {
  const cells = [];
  let idCounter = 400;
  const nextId = () => `cl_${idCounter++}`;

  // Title
  cells.push(vertex(nextId(), 'CineMoments — UML 2.x Class Diagram (Domain Models, Services & Controllers)', 
    'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#1e293b;strokeColor=#3b82f6;fontColor=#ffffff;fontStyle=1;fontSize=15;size=15;', 
    40, 15, 780, 45));

  // Helper to make a UML Class
  function umlClass(id, name, stereotype, attributes, methods, x, y, width, height, color = '#f8fafc', stroke = '#475569') {
    const header = stereotype ? `&lt;&lt;${stereotype}&gt;&gt;&#xa;&lt;b&gt;${name}&lt;/b&gt;` : `&lt;b&gt;${name}&lt;/b&gt;`;
    const attrText = attributes.join('&#xa;');
    const methText = methods.join('&#xa;');
    const fullText = `${header}&#xa;—&#xa;${attrText}&#xa;—&#xa;${methText}`;
    return vertex(id, fullText, 
      `swimlane;fontStyle=0;align=left;spacingLeft=8;spacingRight=8;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;collapsible=0;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=${stroke};fontSize=11;`, 
      x, y, width, height);
  }

  // --- ENTITY CLASSES ---
  // User
  const clUser = nextId();
  cells.push(umlClass(clUser, 'User', 'entity', 
    ['+ id: Integer [PK]', '+ name: String', '+ email: String [Unique]', '+ phone: String', '+ password_hash: String', '+ role: UserRole', '+ status: UserStatus', '+ wallet_balance: Decimal', '+ created_at: DateTime'],
    ['+ verifyPassword(plain): Boolean', '+ deductWallet(amount): Boolean', '+ creditWallet(amount): Void', '+ hasRole(targetRole): Boolean'],
    40, 80, 240, 230, '#eff6ff', '#3b82f6'));

  // Theatre
  const clTheatre = nextId();
  cells.push(umlClass(clTheatre, 'Theatre', 'entity', 
    ['+ id: Integer [PK]', '+ name: String', '+ location: String', '+ address: String', '+ city: String', '+ owner_id: Integer [FK]', '+ status: String', '+ created_at: DateTime'],
    ['+ getScreens(): Screen[*]', '+ getAssignedStaff(): User[*]', '+ calculatePayout(share): Void'],
    340, 80, 230, 190, '#fef2f2', '#ef4444'));

  // Screen
  const clScreen = nextId();
  cells.push(umlClass(clScreen, 'Screen', 'entity', 
    ['+ id: Integer [PK]', '+ theatre_id: Integer [FK]', '+ name: String', '+ capacity: Integer', '+ screen_type: ScreenType', '+ created_at: DateTime'],
    ['+ getScheduledShows(): Show[*]'],
    630, 80, 210, 150, '#fef2f2', '#ef4444'));

  // Movie
  const clMovie = nextId();
  cells.push(umlClass(clMovie, 'Movie', 'entity', 
    ['+ id: Integer [PK]', '+ title: String', '+ poster: String', '+ duration: Integer', '+ language: String', '+ rating: String', '+ genre: String', '+ release_date: Date'],
    ['+ getActiveShows(): Show[*]'],
    900, 80, 220, 180, '#fdf4ff', '#c026d3'));

  // Show
  const clShow = nextId();
  cells.push(umlClass(clShow, 'Show', 'entity', 
    ['+ id: Integer [PK]', '+ movie_id: Integer [FK]', '+ screen_id: Integer [FK]', '+ show_date: Date', '+ start_time: String', '+ end_time: String', '+ interval_start: String', '+ interval_end: String', '+ price_estimate: Decimal', '+ status: ShowStatus'],
    ['+ hasStarted(): Boolean', '+ isIntervalFree(): Boolean', '+ getIntervalSlot(): String'],
    630, 280, 230, 210, '#fdf4ff', '#c026d3'));

  // IntervalBooking
  const clBooking = nextId();
  cells.push(umlClass(clBooking, 'IntervalBooking', 'entity', 
    ['+ id: Integer [PK]', '+ user_id: Integer [FK]', '+ show_id: Integer [FK]', '+ booking_type: BookingType', '+ message: String', '+ contact_phone: String', '+ status: BookingStatus', '+ rejection_reason: String', '+ accepted_at: DateTime', '+ expires_at: DateTime'],
    ['+ markAccepted(): Void', '+ markExpired(): Void', '+ markRejected(reason): Void', '+ canBeAccepted(): Boolean'],
    340, 320, 240, 220, '#fefce8', '#ca8a04'));

  // BookingMedia
  const clMedia = nextId();
  cells.push(umlClass(clMedia, 'BookingMedia', 'entity', 
    ['+ id: Integer [PK]', '+ booking_id: Integer [FK]', '+ file_type: MediaType', '+ encrypted_file_path: String', '+ original_filename: String', '+ mime_type: String', '+ file_size: Integer', '+ iv: String (12-byte Hex)', '+ auth_tag: String (16-byte Hex)'],
    ['+ getDecryptedStream(): Stream', '+ verifyIntegrity(): Boolean'],
    40, 350, 250, 190, '#e0e7ff', '#4338ca'));

  // Transaction
  const clTx = nextId();
  cells.push(umlClass(clTx, 'Transaction', 'entity', 
    ['+ id: Integer [PK]', '+ booking_id: Integer [FK]', '+ user_id: Integer [FK]', '+ theatre_id: Integer [FK]', '+ total_amount: Decimal', '+ theatre_share: Decimal (80%)', '+ admin_share: Decimal (20%)', '+ status: TxStatus', '+ created_at: DateTime'],
    ['+ processSplit(): Void', '+ executeRefund(): Void'],
    340, 580, 240, 180, '#dcfce7', '#16a34a'));

  // Notification
  const clNotif = nextId();
  cells.push(umlClass(clNotif, 'Notification', 'entity', 
    ['+ id: Integer [PK]', '+ user_id: Integer [FK]', '+ booking_id: Integer [FK]', '+ title: String', '+ message: String', '+ type: NotifType', '+ is_read: Boolean', '+ created_at: DateTime'],
    ['+ markAsRead(): Void'],
    40, 580, 240, 160, '#ccfbf1', '#0f766e'));

  // AuditLog
  const clAudit = nextId();
  cells.push(umlClass(clAudit, 'AuditLog', 'entity', 
    ['+ id: Integer [PK]', '+ user_id: Integer [FK]', '+ action: String', '+ entity_type: String', '+ entity_id: Integer', '+ details: JSON', '+ ip_address: String', '+ created_at: DateTime'],
    ['+ record(): Void'],
    40, 780, 240, 160, '#ffedd5', '#c2410c'));

  // ChatMessage
  const clChat = nextId();
  cells.push(umlClass(clChat, 'ChatMessage', 'entity', 
    ['+ id: Integer [PK]', '+ theatre_id: Integer [FK]', '+ user_id: Integer [FK]', '+ sender_id: Integer [FK]', '+ sender_role: UserRole', '+ message: String', '+ booking_id: Integer [FK]', '+ is_read: Boolean', '+ created_at: DateTime'],
    ['+ markRead(): Void'],
    630, 540, 230, 180, '#f1f5f9', '#475569'));

  // --- SERVICE & CONTROLLER CLASSES ---
  // BookingController
  const clBookCtrl = nextId();
  cells.push(umlClass(clBookCtrl, 'BookingController', 'controller', 
    ['', ''], 
    ['+ createBooking(req, res): Promise', '+ getBooking(req, res): Promise', '+ listBookings(req, res): Promise', '+ acceptBooking(req, res): Promise', '+ rejectBooking(req, res): Promise', '+ cancelBooking(req, res): Promise'],
    1180, 80, 260, 160, '#ede9fe', '#7c3aed'));

  // BookingService
  const clBookSrv = nextId();
  cells.push(umlClass(clBookSrv, 'BookingService', 'service', 
    ['', ''], 
    ['+ createBooking(input): Object', '+ acceptBooking(id, staffId): Object', '+ rejectBooking(id, staffId, reason): Object', '+ cancelBooking(id, userId): Object', '+ refundBookingTransaction(db, id): Void'],
    1180, 280, 270, 170, '#fef08a', '#ca8a04'));

  // CryptoService
  const clCryptoSrv = nextId();
  cells.push(umlClass(clCryptoSrv, 'CryptoService', 'service', 
    ['+ ALGORITHM: String = "aes-256-gcm"', '+ KEY_LENGTH: Integer = 32', '+ IV_LENGTH: Integer = 12'], 
    ['+ validateMediaBuffer(buf, filename): Object', '+ encryptBuffer(buf): Object', '+ decryptBuffer(encBuf, iv, tag): Buffer', '+ streamDecryptedMedia(id, res): Stream'],
    1180, 480, 270, 150, '#e0e7ff', '#4338ca'));

  // NotificationService
  const clNotifSrv = nextId();
  cells.push(umlClass(clNotifSrv, 'NotificationService', 'service', 
    ['', ''], 
    ['+ createNotification(user, bId, title, msg, type): Void', '+ getUserNotifications(userId): Notification[*]', '+ markAsRead(id, userId): Void'],
    1180, 660, 270, 120, '#ccfbf1', '#0f766e'));

  // ExpirationWorker
  const clWorker = nextId();
  cells.push(umlClass(clWorker, 'ExpirationWorker', 'worker', 
    ['+ CHECK_INTERVAL_MS: Integer = 60000', '+ timerHandle: Timeout'], 
    ['+ startWorker(): Void', '+ expireOverdueBookings(): Integer', '+ stopWorker(): Void'],
    1180, 810, 270, 120, '#f3e8ff', '#9333ea'));

  // --- ENUMERATIONS ---
  const clEnumRole = nextId();
  cells.push(vertex(clEnumRole, '&lt;&lt;enumeration&gt;&gt;&#xa;&lt;b&gt;UserRole&lt;/b&gt;&#xa;—&#xa;CUSTOMER&#xa;STAFF&#xa;ADMIN', 
    'rounded=1;whiteSpace=wrap;html=1;align=center;fillColor=#f8fafc;strokeColor=#64748b;fontSize=10;', 340, 800, 120, 80));

  const clEnumStatus = nextId();
  cells.push(vertex(clEnumStatus, '&lt;&lt;enumeration&gt;&gt;&#xa;&lt;b&gt;BookingStatus&lt;/b&gt;&#xa;—&#xa;PENDING&#xa;UNDER_REVIEW&#xa;ACCEPTED&#xa;REJECTED&#xa;EXPIRED&#xa;CANCELLED&#xa;COMPLETED', 
    'rounded=1;whiteSpace=wrap;html=1;align=center;fillColor=#f8fafc;strokeColor=#64748b;fontSize=10;', 480, 800, 130, 130));

  const clEnumType = nextId();
  cells.push(vertex(clEnumType, '&lt;&lt;enumeration&gt;&gt;&#xa;&lt;b&gt;BookingType&lt;/b&gt;&#xa;—&#xa;MARRIAGE_PROPOSAL&#xa;LOVE_PROPOSAL&#xa;ADVERTISEMENT&#xa;BIRTHDAY&#xa;ANNIVERSARY&#xa;PROMOTION&#xa;EVENT', 
    'rounded=1;whiteSpace=wrap;html=1;align=center;fillColor=#f8fafc;strokeColor=#64748b;fontSize=10;', 630, 800, 150, 130));

  // --- RELATIONSHIPS ---
  // User 1 -- * IntervalBooking
  cells.push(edge(nextId(), '1\nplaces\n*', 'endArrow=none;html=1;strokeColor=#3b82f6;fontSize=10;', clUser, clBooking));

  // Theatre 1 -- * Screen (Composition)
  cells.push(edge(nextId(), '1\ncontains\n1..*', 'startArrow=diamond;startFill=1;endArrow=none;html=1;strokeColor=#ef4444;fontSize=10;', clTheatre, clScreen));

  // Screen 1 -- * Show (Composition)
  cells.push(edge(nextId(), '1\nschedules\n*', 'startArrow=diamond;startFill=1;endArrow=none;html=1;strokeColor=#ef4444;fontSize=10;', clScreen, clShow));

  // Movie 1 -- * Show
  cells.push(edge(nextId(), '1\nscreens\n*', 'endArrow=none;html=1;strokeColor=#c026d3;fontSize=10;', clMovie, clShow));

  // Show 1 -- * IntervalBooking (Aggregates)
  cells.push(edge(nextId(), '1\nreserves interval\n*', 'startArrow=diamond;startFill=0;endArrow=none;html=1;strokeColor=#ca8a04;fontSize=10;', clShow, clBooking));

  // IntervalBooking 1 -- 0..1 BookingMedia (Composition)
  cells.push(edge(nextId(), '1\nattaches\n0..1', 'startArrow=diamond;startFill=1;endArrow=none;html=1;strokeColor=#4338ca;fontSize=10;', clBooking, clMedia));

  // IntervalBooking 1 -- 1 Transaction (Composition)
  cells.push(edge(nextId(), '1\ngenerates\n1', 'startArrow=diamond;startFill=1;endArrow=none;html=1;strokeColor=#16a34a;fontSize=10;', clBooking, clTx));

  // User 1 -- * Notification
  cells.push(edge(nextId(), '1\nreceives\n*', 'endArrow=none;html=1;strokeColor=#0f766e;fontSize=10;', clUser, clNotif));

  // User 1 -- * AuditLog
  cells.push(edge(nextId(), '1\ntriggers\n*', 'endArrow=none;html=1;strokeColor=#c2410c;fontSize=10;', clUser, clAudit));

  // Controller --> Service (Dependency)
  cells.push(edge(nextId(), '&lt;&lt;delegates&gt;&gt;', 'endArrow=open;dashed=1;html=1;strokeColor=#7c3aed;fontSize=10;', clBookCtrl, clBookSrv));

  // Service --> CryptoService (Dependency)
  cells.push(edge(nextId(), '&lt;&lt;encrypts&gt;&gt;', 'endArrow=open;dashed=1;html=1;strokeColor=#4338ca;fontSize=10;', clBookSrv, clCryptoSrv));

  // Service --> NotificationService (Dependency)
  cells.push(edge(nextId(), '&lt;&lt;notifies&gt;&gt;', 'endArrow=open;dashed=1;html=1;strokeColor=#0f766e;fontSize=10;', clBookSrv, clNotifSrv));

  // Service --> IntervalBooking (Manages)
  cells.push(edge(nextId(), '&lt;&lt;mutates&gt;&gt;', 'endArrow=open;dashed=1;html=1;strokeColor=#ca8a04;fontSize=10;', clBookSrv, clBooking));

  return { id: 'class_diag', name: 'Class Diagram', pageWidth: 1500, pageHeight: 1000, cells };
}

// -------------------------------------------------------------
// BUILDER & WRITER
// -------------------------------------------------------------
function createMxFile(diagrams) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<mxfile host="Electron" agent="Mozilla/5.0" version="24.0.0">\n`;
  for (const diag of diagrams) {
    xml += `  <diagram id="${diag.id}" name="${diag.name}">\n`;
    xml += `    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${diag.pageWidth || 1600}" pageHeight="${diag.pageHeight || 1200}" math="0" shadow="0">\n`;
    xml += `      <root>\n`;
    xml += `        <mxCell id="0" />\n`;
    xml += `        <mxCell id="1" parent="0" />\n`;
    for (const cell of diag.cells) {
      xml += `        ${cell}\n`;
    }
    xml += `      </root>\n`;
    xml += `    </mxGraphModel>\n`;
    xml += `  </diagram>\n`;
  }
  xml += `</mxfile>\n`;
  return xml;
}

const commDiag = buildCommunicationDiagram();
const seqDiag = buildSequenceDiagram();
const actDiag = buildActivityDiagram();
const clDiag = buildClassDiagram();

// Write individual files
fs.writeFileSync(path.join(process.cwd(), 'communication_diagram.drawio'), createMxFile([commDiag]));
console.log('✓ Created communication_diagram.drawio');

fs.writeFileSync(path.join(process.cwd(), 'sequence_diagram.drawio'), createMxFile([seqDiag]));
console.log('✓ Created sequence_diagram.drawio');

fs.writeFileSync(path.join(process.cwd(), 'activity_diagram.drawio'), createMxFile([actDiag]));
console.log('✓ Created activity_diagram.drawio');

fs.writeFileSync(path.join(process.cwd(), 'class_diagram.drawio'), createMxFile([clDiag]));
console.log('✓ Created class_diagram.drawio');

// Write unified multi-page workbook
fs.writeFileSync(path.join(process.cwd(), 'cinemoments_all_diagrams.drawio'), createMxFile([commDiag, seqDiag, actDiag, clDiag]));
console.log('✓ Created cinemoments_all_diagrams.drawio (Unified multi-tab workbook)');
