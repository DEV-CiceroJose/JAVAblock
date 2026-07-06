export function requireAdmin(expectedToken) {
  return (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token || token !== expectedToken) {
      return res.status(401).json({ error: 'Token inválido ou ausente.' });
    }
    next();
  };
}
