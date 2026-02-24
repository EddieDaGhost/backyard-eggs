module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(401).json({ valid: false, error: 'Invalid password' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};
