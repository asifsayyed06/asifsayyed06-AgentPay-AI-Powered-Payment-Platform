const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Verifies the agent's identity token on every transaction-initiating request.
// This is the core trust boundary: nothing downstream should trust an
// agent's claimed identity unless it passed through here first.
function verifyAgentToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.agent = decoded; // { agentId, ownerId, scopes, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired agent token' });
  }
}

function signAgentToken(agent) {
  return jwt.sign(
    {
      agentId: agent.id,
      ownerId: agent.ownerId,
      scopes: agent.scopes
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

module.exports = { verifyAgentToken, signAgentToken, JWT_SECRET };
