// Envolve um handler async: encaminha rejeições para o next(err).
export function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Middleware terminal de erro (4 args). Responde 500 sem vazar detalhes internos.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('Erro na requisição:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
}
