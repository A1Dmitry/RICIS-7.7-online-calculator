const ipChatHistory: Record<string, number[]> = {};

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  if (!ipChatHistory[ip]) {
    ipChatHistory[ip] = [];
  } else {
    ipChatHistory[ip] = ipChatHistory[ip].filter(ts => ts > oneMinuteAgo);
  }

  if (ipChatHistory[ip].length >= 5) {
    return true;
  }

  ipChatHistory[ip].push(now);
  return false;
}
