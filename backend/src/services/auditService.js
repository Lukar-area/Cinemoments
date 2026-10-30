import AuditLog from '../models/AuditLog.js';
import { isDBConnected } from '../db/database.js';

/**
 * Inserts an immutable audit record for security and administrative monitoring.
 */
export async function recordAuditLog(entry) {
    if (!isDBConnected()) {
        return;
    }
    try {
        const detailsStr = entry.details ? (typeof entry.details === 'object' ? JSON.stringify(entry.details) : String(entry.details)) : null;
        await AuditLog.create({
            user_id: entry.userId || null,
            action: entry.action,
            entity_type: entry.entityType,
            entity_id: entry.entityId || null,
            details: detailsStr,
            ip_address: entry.ipAddress || null,
        });
    }
    catch (error) {
        // Non-blocking logger error handling
        console.error('Failed to write audit log:', error);
    }
}
