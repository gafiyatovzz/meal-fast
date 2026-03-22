// Mock CSS/LESS modules for Jest
const handler: ProxyHandler<Record<string, string>> = {
  get: (_target, prop) => (typeof prop === 'string' ? prop : ''),
}
module.exports = new Proxy({}, handler)
