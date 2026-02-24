module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;

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

    reservations.reservations.unshift(reservation);

    if (reservations.reservations.length > 100) {
      reservations.reservations = reservations.reservations.slice(0, 100);
    }

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

    await sendDiscordNotification(reservation);

    return res.status(200).json({
      success: true,
      message: "Reservation received! We'll contact you soon.",
      reservation
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to submit reservation',
      message: error.message
    });
  }
};

async function sendDiscordNotification(reservation) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('Discord webhook URL not configured, skipping notification');
    return;
  }

  try {
    const embed = {
      title: '🥚 New Egg Reservation!',
      color: 0xF4A460,
      fields: [
        { name: '👤 Customer',   value: reservation.name,                      inline: true },
        { name: '📧 Email',      value: reservation.email,                     inline: true },
        { name: '📞 Phone',      value: reservation.phone,                     inline: true },
        { name: '🥚 Quantity',   value: `${reservation.quantity} carton(s)`,   inline: true },
        { name: '📦 Batch',      value: reservation.batch,                     inline: true },
        { name: '📅 Pickup',     value: reservation.pickupDate,                inline: true }
      ],
      timestamp: reservation.submittedAt,
      footer: { text: 'Backyard Eggs - Reservation System' }
    };

    if (reservation.message) {
      embed.fields.push({ name: '💬 Message', value: reservation.message, inline: false });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}
