import multer from 'multer';
// Store in memory so we can validate magic bytes and encrypt before saving to disk
const storage = multer.memoryStorage();
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.mp4', '.webm'];
function fileFilter(req, file, cb) {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        cb(new Error(`Unsupported file type (${ext}). Only JPG, PNG, MP4, and WebM files are allowed.`));
        return;
    }
    cb(null, true);
}
export const uploadMedia = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max
        files: 1,
    },
});
