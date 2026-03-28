const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { password, batches, availability } = JSON.parse(event.body);

    // Verify password
    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid password' })
      };
    }

    // Prepare the updated data
    const updatedData = {
      batches: batches || [],
      availability: availability || {
        status: 'available',
        message: 'Fresh eggs available now!',
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    // Get current file content from GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';
    const path = 'data/batches.json';

    const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const content = Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64');
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const getResponse = await fetch(getFileUrl, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha;
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }

      const updateResponse = await fetch(getFileUrl, {
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
          branch: 'main'
        })
      });

      if (updateResponse.ok) {
        break;
      }

      const errorData = await updateResponse.json();

      if (updateResponse.status === 409 && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      throw new Error(`GitHub API error: ${errorData.message}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Batches updated successfully! Site will redeploy in 1-2 minutes.',
        data: updatedData
      })
    };

  } catch (error) {
    console.error('Error updating batches:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update batches',
        message: error.message
      })
    };
  }
};
