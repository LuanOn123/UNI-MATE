export function notFound(req, res) {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, _req, res, _next) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const statusCode = typeof err === "object" && err && "statusCode" in err ? Number(err.statusCode) : 500;
    console.error(err);
    res.status(Number.isFinite(statusCode) ? statusCode : 500).json({ success: false, message });
}
