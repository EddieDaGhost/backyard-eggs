const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const formData = JSON.parse(event.body);

    // Create reservation object
    const reservation = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || 'Not provided',
      quantity: formData.quantity,
      batch: formData.batch || 'No preference',
      pickupDate: formData.pickupDate || 'Not specified',
      message: formData.message || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      submittedDate: new Date().toLocaleDateString('en-US')
    };

    // Get current reservations
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'EddieDaGhost';
    const repo = process.env.GITHUB_REPO || 'backyard-eggs';
    const path = 'data/reservations.json';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const getRes = await fetch(url, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let reservations = { reservations: [] };
    let sha;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const content = Buffer.from(fileData.content, 'base64').toString();
      reservations = JSON.parse(content);
    }

    // Add new reservation
    reservations.reservations.unshift(reservation); // Add to beginning

    // Keep only last 100 reservations
    if (reservations.reservations.length > 100) {
      reservations.reservations = reservations.reservations.slice(0, 100);
    }

    // Update file
    const newContent = Buffer.from(JSON.stringify(reservations, null, 2)).toString('base64');

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `New reservation from ${reservation.name} - ${new Date().toISOString()}`,
        content: newContent,
        sha: sha,
        branch: 'main'
      })
    });

    if (!putRes.ok) {
      const error = await putRes.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }

    // Optional: Send email notification (requires email service setup)
    // You can add email service integration here (SendGrid, Mailgun, etc.)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Reservation received! We\'ll contact you soon.',
        reservation: reservation
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to submit reservation',
        message: error.message
      })
    };
  }
};
