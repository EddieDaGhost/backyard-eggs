module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, batches, content, reservations } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';

    if (batches) {
      await updateFile(githubToken, owner, repo, 'data/batches.json', batches);
    }

    if (content) {
      await updateFile(githubToken, owner, repo, 'data/content.json', content);
    }

    if (reservations) {
      await updateFile(githubToken, owner, repo, 'data/reservations.json', reservations);
    }

    return res.status(200).json({
      success: true,
      message: 'Content updated successfully! Site will redeploy in 1-2 minutes.'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to update content',
      message: error.message
    });
  }
};

async function updateFile(token, owner, repo, path, data) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const getRes = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  let sha;
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Update ${path} via admin dashboard - ${new Date().toISOString()}`,
      content,
      sha,
      branch: 'main'
    })
  });

  if (!putRes.ok) {
    const error = await putRes.json();
    throw new Error(`GitHub API error: ${error.message}`);
  }

  return putRes.json();
}
