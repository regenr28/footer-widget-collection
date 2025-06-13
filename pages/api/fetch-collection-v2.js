// pages/api/fetch-collection-v2.js

import { Duda } from '@dudadev/partner-api';

export default async function handler(req, res) {
  const uname = process.env.DUDA_API_USERNAME;
  const pass = process.env.DUDA_API_PASSWORD;

  console.log('DUDA_API_USERNAME:', uname || 'missing');
  console.log('DUDA_API_PASSWORD:', pass ? 'set' : 'missing');

  // Check credentials
  if (!uname || !pass) {
    console.error('Missing Duda credentials');
    return res.status(500).json({ error: 'Missing Duda credentials' });
  }

  // Get site_name from query params
  const { site_name } = req.query;
  if (!site_name) {
    console.error('Missing site_name parameter');
    return res.status(400).json({ error: 'Missing required parameter: site_name' });
  }

  // Initialize Duda API client
  const duda = new Duda({
    user: uname,
    pass: pass
  });

  try {
    // Call collections.list as shown in the Duda docs
    const collections = await duda.collections.list({ site_name });

    // Return collections as JSON
    res.status(200).json(collections);

  } catch (err) {
    console.error('Duda API Error:', err);
    res.status(500).json({ error: 'Duda API request failed', details: err.message });
  }
}
