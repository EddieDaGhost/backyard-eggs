exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { password, filename, imageData } = JSON.parse(event.body);

    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid password' })
      };
    }

    if (!filename || !imageData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing filename or image data' })
      };
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';

    // Clean filename
    const cleanName = filename.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.\-_]/g, '');
    const path = `images/${cleanName}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Strip data URL prefix if present
    const base64Content = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    // Check if file already exists
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

    const putBody = {
      message: `Upload chicken photo: ${cleanName} - ${new Date().toISOString()}`,
      content: base64Content,
      branch: 'main'
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const error = await putRes.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        path: path,
        filename: cleanName,
        message: 'Image uploaded successfully!'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to upload image',
        message: error.message
      })
    };
  }
};
