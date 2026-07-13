export function notFound(req, res) {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, _req, res, _next) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    let statusCode = typeof err === "object" && err && "statusCode" in err ? Number(err.statusCode) : 500;
    if (typeof err === "object" && err !== null && ("code" in err || "name" in err)) {
        const code = err.code;
        const name = err.name;
        if (code === "LIMIT_FILE_SIZE" || message === "File too large") {
            return res.status(413).json({
                success: false,
                message: "Dung lượng ảnh/file tải lên vượt quá giới hạn cho phép (tối đa 20MB). Vui lòng chọn ảnh nhỏ hơn."
            });
        }
        if (name === "MulterError") {
            return res.status(400).json({
                success: false,
                message: `Lỗi tải ảnh/file: ${message}`
            });
        }
    }
    if (Number.isFinite(statusCode) && statusCode >= 500) {
        console.error(err);
    }
    else {
        console.warn(`[API ${statusCode}] ${_req.method} ${_req.originalUrl} - ${message}`);
    }
    res.status(Number.isFinite(statusCode) ? statusCode : 500).json({ success: false, message });
}
