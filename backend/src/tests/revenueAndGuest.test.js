import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../db/database.js';
import { createBooking, cancelBooking, getUserTransactions, getTheatreEarnings, getAllTransactions } from '../services/bookingService.js';
import bcrypt from 'bcryptjs';
test('Revenue Share and Wallet Transactions: 80% Theatre Owner & 20% Super Admin', () => {
    const db = getDb();
    const passwordHash = bcrypt.hashSync('Pass123!', 10);
    // 1. Create a fresh test customer with 2000.00 balance
    const custRes = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status, wallet_balance)
    VALUES ('Test Customer', 'testcust_${Date.now()}@example.com', ?, 'CUSTOMER', 'ACTIVE', 2000.00)
  `).run(passwordHash);
    const testCustId = Number(custRes.lastInsertRowid);
    // 2. Fetch admin user and record initial balance
    const adminUser = db.prepare(`SELECT id, wallet_balance FROM users WHERE role = 'ADMIN' LIMIT 1`).get();
    const initialAdminBalance = Number(adminUser.wallet_balance || 0);
    // 3. Fetch a theatre and its owner
    const theatre = db.prepare(`SELECT id, owner_id FROM theatres LIMIT 1`).get();
    const owner = db.prepare(`SELECT id, wallet_balance FROM users WHERE id = ?`).get(theatre.owner_id);
    const initialOwnerBalance = Number(owner.wallet_balance || 0);
    // 4. Create a test show with price_estimate = 500.00
    const screen = db.prepare(`SELECT id FROM screens WHERE theatre_id = ? LIMIT 1`).get(theatre.id);
    const movie = db.prepare(`SELECT id FROM movies LIMIT 1`).get();
    const showRes = db.prepare(`
    INSERT INTO shows (movie_id, screen_id, show_date, start_time, end_time, interval_start, interval_end, price_estimate, status)
    VALUES (?, ?, '2099-01-01', '19:00', '21:30', '20:10', '20:25', 500.00, 'SCHEDULED')
  `).run(movie.id, screen.id);
    const testShowId = Number(showRes.lastInsertRowid);
    // 5. Submit booking
    const { bookingId } = createBooking({
        userId: testCustId,
        showId: testShowId,
        bookingType: 'MARRIAGE_PROPOSAL',
        message: 'Test message proposal',
    });
    assert.ok(bookingId > 0, 'Booking must be created');
    // Verify Customer Wallet: 2000 - 500 = 1500
    const updatedCust = db.prepare(`SELECT wallet_balance FROM users WHERE id = ?`).get(testCustId);
    assert.strictEqual(Number(updatedCust.wallet_balance), 1500.00, 'Customer wallet must be debited by 500');
    // Verify Theatre Owner Wallet: initial + 400 (80%)
    const updatedOwner = db.prepare(`SELECT wallet_balance FROM users WHERE id = ?`).get(theatre.owner_id);
    assert.strictEqual(Number(updatedOwner.wallet_balance), initialOwnerBalance + 400.00, 'Theatre owner must receive 80% (₹400)');
    // Verify Super Admin Wallet: initial + 100 (20%)
    const updatedAdmin = db.prepare(`SELECT wallet_balance FROM users WHERE id = ?`).get(adminUser.id);
    assert.strictEqual(Number(updatedAdmin.wallet_balance), initialAdminBalance + 100.00, 'Super admin must receive 20% (₹100)');
    // Verify Transaction Record
    const tx = db.prepare(`SELECT * FROM transactions WHERE booking_id = ?`).get(bookingId);
    assert.strictEqual(tx.total_amount, 500);
    assert.strictEqual(tx.theatre_share, 400);
    assert.strictEqual(tx.admin_share, 100);
    assert.strictEqual(tx.status, 'COMPLETED');
    // Test Customer Transactions query
    const myTx = getUserTransactions(testCustId);
    assert.strictEqual(myTx.length, 1);
    // Test Theatre Earnings query
    const theatreEarn = getTheatreEarnings(theatre.id);
    assert.ok(theatreEarn.summary.total_earnings >= 400);
    // Test Admin Global Transactions query
    const allTx = getAllTransactions();
    assert.ok(allTx.summary.total_admin_commission >= 100);
    // 6. Test Refund on Cancellation
    cancelBooking(bookingId, testCustId);
    // Customer Wallet restored to 2000
    const refundedCust = db.prepare(`SELECT wallet_balance FROM users WHERE id = ?`).get(testCustId);
    assert.strictEqual(Number(refundedCust.wallet_balance), 2000.00, 'Customer wallet must be refunded to 2000');
    // Owner & Admin shares reversed
    const refundedOwner = db.prepare(`SELECT wallet_balance FROM users WHERE id = ?`).get(theatre.owner_id);
    assert.strictEqual(Number(refundedOwner.wallet_balance), initialOwnerBalance, 'Owner share must be refunded');
    const refundedAdmin = db.prepare(`SELECT wallet_balance FROM users WHERE id = ?`).get(adminUser.id);
    assert.strictEqual(Number(refundedAdmin.wallet_balance), initialAdminBalance, 'Admin share must be refunded');
    // Transaction marked REFUNDED
    const refundedTx = db.prepare(`SELECT status FROM transactions WHERE booking_id = ?`).get(bookingId);
    assert.strictEqual(refundedTx.status, 'REFUNDED');
});
test('Chat Messages Exchange between User and Theatre Admin', () => {
    const db = getDb();
    const theatre = db.prepare(`SELECT id, owner_id FROM theatres LIMIT 1`).get();
    const user = db.prepare(`SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1`).get();
    // Insert customer message
    const cMsg = db.prepare(`
    INSERT INTO chat_messages (theatre_id, user_id, sender_id, sender_role, message)
    VALUES (?, ?, ?, 'CUSTOMER', 'Is laser projection calibrated?')
  `).run(theatre.id, user.id, user.id);
    assert.ok(Number(cMsg.lastInsertRowid) > 0);
    // Insert staff reply
    const sMsg = db.prepare(`
    INSERT INTO chat_messages (theatre_id, user_id, sender_id, sender_role, message)
    VALUES (?, ?, ?, 'STAFF', 'Yes, calibrated daily!')
  `).run(theatre.id, user.id, theatre.owner_id);
    assert.ok(Number(sMsg.lastInsertRowid) > 0);
    const messages = db.prepare(`
    SELECT * FROM chat_messages WHERE theatre_id = ? AND user_id = ? ORDER BY created_at ASC
  `).all(theatre.id, user.id);
    assert.ok(messages.length >= 2);
    assert.strictEqual(messages[messages.length - 1].message, 'Yes, calibrated daily!');
});
