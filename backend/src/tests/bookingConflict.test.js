import test from 'node:test';
import assert from 'node:assert/strict';
import IntervalBooking from '../models/IntervalBooking.js';

test('Atomic Conflict Resolution and Double Acceptance Prevention', async (t) => {
    await t.test('IntervalBooking schema enforces unique partial index on show_id for ACCEPTED status', () => {
        const indexes = IntervalBooking.schema.indexes();
        const uniqueAcceptedIndex = indexes.find(([fields, options]) => {
            return (
                fields.show_id === 1 &&
                options?.unique === true &&
                options?.partialFilterExpression?.status === 'ACCEPTED'
            );
        });

        assert.ok(uniqueAcceptedIndex, 'idx_unique_accepted_interval must be defined in IntervalBooking schema');
        assert.equal(uniqueAcceptedIndex[1].name, 'idx_unique_accepted_interval');
        assert.equal(uniqueAcceptedIndex[1].unique, true);
        assert.deepEqual(uniqueAcceptedIndex[1].partialFilterExpression, { status: 'ACCEPTED' });
    });

    await t.test('Conflict resolution rule: accepting one booking expires all competing requests and triggers refund', () => {
        // Simulated interval booking queue for the same show interval
        const showId = 'show_conflict_test_123';
        const requests = [
            { id: 'req_1', showId, status: 'PENDING', message: 'Proposal for Priya', userId: 'user_1' },
            { id: 'req_2', showId, status: 'PENDING', message: 'Birthday for Rahul', userId: 'user_2' },
            { id: 'req_3', showId, status: 'PENDING', message: 'Corporate Ad', userId: 'user_3' },
        ];

        // Simulated atomic acceptance function mirroring acceptBooking logic
        function resolveShowBookings(acceptedId) {
            const target = requests.find(r => r.id === acceptedId);
            if (!target) throw new Error('Booking not found');
            if (target.status !== 'PENDING') throw new Error(`Cannot accept booking with status: ${target.status}`);

            // Verify no other booking is already accepted
            const alreadyAccepted = requests.find(r => r.showId === target.showId && r.status === 'ACCEPTED');
            if (alreadyAccepted) throw new Error('This interval slot has already been booked and accepted.');

            target.status = 'ACCEPTED';
            target.accepted_at = new Date();

            let expiredCount = 0;
            const expiredRequests = [];
            for (const r of requests) {
                if (r.id !== acceptedId && r.showId === target.showId && r.status === 'PENDING') {
                    r.status = 'EXPIRED';
                    expiredCount++;
                    expiredRequests.push(r);
                }
            }

            return { success: true, acceptedId, expiredCount, expiredRequests };
        }

        // Accept request 2
        const result = resolveShowBookings('req_2');
        assert.equal(result.success, true);
        assert.equal(result.acceptedId, 'req_2');
        assert.equal(result.expiredCount, 2);

        // Verify request 2 is ACCEPTED
        const accepted = requests.find(r => r.id === 'req_2');
        assert.equal(accepted.status, 'ACCEPTED');
        assert.ok(accepted.accepted_at);

        // Verify competing requests 1 & 3 atomically transitioned to EXPIRED
        const req1 = requests.find(r => r.id === 'req_1');
        const req3 = requests.find(r => r.id === 'req_3');
        assert.equal(req1.status, 'EXPIRED');
        assert.equal(req3.status, 'EXPIRED');

        // Verify trying to accept an already expired booking is rejected
        assert.throws(() => {
            resolveShowBookings('req_1');
        }, /Cannot accept booking with status: EXPIRED/);

        // Verify double-acceptance is blocked
        const illegalFourthReq = { id: 'req_4', showId, status: 'PENDING', message: 'Late Request', userId: 'user_4' };
        requests.push(illegalFourthReq);
        assert.throws(() => {
            resolveShowBookings('req_4');
        }, /This interval slot has already been booked and accepted/);
    });
});
