// One endpoint contract for the scope fixture server and its Playwright routing.
export function scopeEndpoint(env = process.env) {
 const value = env.EN_SCOPE_PORT;
 if (value !== undefined && (typeof value !== 'string' || !/^[1-9]\d{0,4}$/.test(value) || Number(value) > 65535)) {
  throw new Error('EN_SCOPE_PORT must be a decimal integer from 1 to 65535');
 }
 const port = value === undefined ? 4198 : Number(value);
 return {host: '127.0.0.1', port, origin: `http://127.0.0.1:${port}`};
}
