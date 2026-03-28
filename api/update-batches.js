module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, batches, availability } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const updatedData = {
      batches: batches || [],
      availability: availability || {
        status: 'available',
        message: 'Fresh eggs available now!',
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const path = 'data/batches.json';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const content = Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64');
    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const getRes = await fetch(url, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha;
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update batches via admin dashboard - ${new Date().toISOString()}`,
          content,
          sha,
          branch
        })
      });

      if (putRes.ok) {
        lastError = null;
        break;
      }

      const errorData = await putRes.json();
      lastError = errorData.message;

      if (putRes.status === 409 && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      throw new Error(`GitHub API error: ${errorData.message}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Batches updated successfully! Site will redeploy in 1-2 minutes.',
      data: updatedData
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to update batches',
      message: error.message
    });
  }
};
