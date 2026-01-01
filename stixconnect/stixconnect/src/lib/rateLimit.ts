// Simple rate limiting using in-memory storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
}) {
  return (req: Request): NextResponse | null => {
    const clientId = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const key = `${clientId}:${new URL(req.url).pathname}`;
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return null; // Allow request
    }
    
    if (record.count >= options.maxRequests) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${options.maxRequests} requests per ${options.windowMs}ms.`
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
          }
        }
      );
    }
    
    record.count++;
    return null; // Allow request
  };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute