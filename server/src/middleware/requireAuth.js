import jwt from 'jsonwebtoken';

export function requireAuth(request, response, next) {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token || !process.env.JWT_SECRET) {
    return response.status(401).json({ message: 'Authentication is required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return response.status(401).json({ message: 'Authentication is required.' });
    }
    request.userId = payload.sub;
    return next();
  } catch {
    return response.status(401).json({ message: 'Authentication is required.' });
  }
}
