export function errorHandler(err, req, res, next) {
    // Log full error on the server for debugging
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
    let statusCode = err.statusCode || (err.name === 'MulterError' ? 400 : 500);
    let userFriendlyMessage = err.message || 'An unexpected server error occurred.';

    // Friendly messages for specific common errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        userFriendlyMessage = 'The selected file exceeds the 25MB maximum upload limit.';
    }
    else if (err.code === 11000 || (err.message && (err.message.includes('E11000') || err.message.includes('UNIQUE constraint failed')))) {
        statusCode = 409;
        userFriendlyMessage = 'This request conflicts with an existing resource or booking.';
    }

    res.status(statusCode).json({
        success: false,
        message: userFriendlyMessage,
    });
}
