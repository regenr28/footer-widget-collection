// pages/api/fetch-collection.js

const { Duda } = require('@dudadev/partner-api');

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // You can restrict this later to your Duda domain
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

export default async function handler(req, res) {
    setCorsHeaders(res); // Add CORS headers first

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const uname = process.env.DUDA_API_USERNAME;
  const pass = process.env.DUDA_API_PASSWORD;

  console.log('DUDA_API_USERNAME:', uname || 'missing');
  console.log('DUDA_API_PASSWORD:', pass ? 'set' : 'missing');

  if (!uname || !pass) {
    console.error('Missing Duda credentials');
    return res.status(500).json({ error: 'Missing Duda credentials' });
  }

  const { site_name, collection_name } = req.query;

  if (!site_name || !collection_name) {
    console.error('Missing required parameters');
    return res.status(400).json({ error: 'Missing required parameters: site_name and collection_name' });
  }

  const duda = new Duda({
    user: uname,
    pass: pass
  });

  try {
    const collection = await duda.collections.get({
      site_name,
      collection_name
    });

    res.status(200).json(collection);

  } catch (err) {
    console.error('Duda API Error:', err);
    res.status(500).json({ error: 'Duda API request failed', details: err.message });
  }
}
