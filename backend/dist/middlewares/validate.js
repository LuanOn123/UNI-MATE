export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
        const validationIssues = result.error.issues.map((issue) => ({
            path: issue.path.filter((part) => part !== "body").join("."),
            message: issue.message
        }));
        return res.status(422).json({ success: false, message: "Validation failed", validationIssues, issues: result.error.flatten() });
    }
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;
    next();
};
