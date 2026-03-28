module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, filename, imageData } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!filename || !imageData) {
      return res.status(400).json({ error: 'Missing filename or image data' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!githubToken) {
      return res.status(500).json({ error: 'GitHub token not configured' });
    }

    // Clean filename: lowercase, replace spaces with hyphens, keep only safe chars
    const cleanName = filename.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.\-_]/g, '');
    const path = `images/${cleanName}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Strip the data URL prefix if present (e.g. "data:image/jpeg;base64,")
    const base64Content = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    // Check if file already exists to get its SHA
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

    // Upload/update the image file
    const putBody = {
      message: `Upload chicken photo: ${cleanName} - ${new Date().toISOString()}`,
      content: base64Content,
      branch
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

    return res.status(200).json({
      success: true,
      path: path,
      filename: cleanName,
      message: 'Image uploaded successfully!'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }
};
