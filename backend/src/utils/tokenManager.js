const jwt = require('jsonwebtoken');

class TokenManager {
  constructor() {
    // In-memory blacklist - in production, use Redis or database
    this.blacklist = new Set();
    
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  addToBlacklist(token) {
    if (token) {
      this.blacklist.add(token);
    }
  }

  isBlacklisted(token) {
    return this.blacklist.has(token);
  }

  cleanupExpiredTokens() {
    const expiredTokens = [];
    
    for (const token of this.blacklist) {
      try {
        // Check if token is expired
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          expiredTokens.push(token);
        }
      }
    }
    
    // Remove expired tokens from blacklist
    expiredTokens.forEach(token => {
      this.blacklist.delete(token);
    });
    
    if (expiredTokens.length > 0) {
      console.log(`Cleaned up ${expiredTokens.length} expired tokens from blacklist`);
    }
  }

  getBlacklistSize() {
    return this.blacklist.size;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
module.exports = new TokenManager();