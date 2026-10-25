import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'cinemoments_super_secret_jwt_key_2026_dev_mode_only!',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    fileEncryptionKey: process.env.FILE_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cinemoments',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
