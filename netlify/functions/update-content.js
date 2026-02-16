const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { password, batches, content, reservations } = JSON.parse(event.body);

    // Verify password
    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid password' })
      };
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';

    // Update batches.json
    if (batches) {
      await updateFile(githubToken, owner, repo, 'data/batches.json', batches);
    }

    // Update content.json
    if (content) {
      await updateFile(githubToken, owner, repo, 'data/content.json', content);
    }

    // Update reservations.json
    if (reservations) {
      await updateFile(githubToken, owner, repo, 'data/reservations.json', reservations);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Content updated successfully! Site will redeploy in 1-2 minutes.'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update content',
        message: error.message
      })
    };
  }
};

async function updateFile(token, owner, repo, path, data) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get current file SHA
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

  // Update file
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
      content: content,
      sha: sha,
      branch: 'main'
    })
  });

  if (!putRes.ok) {
    const error = await putRes.json();
    throw new Error(`GitHub API error: ${error.message}`);
  }

  return putRes.json();
}
