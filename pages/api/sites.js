// pages/api/sites.js

export default async function handler(req, res) {
    const uname = process.env.DUDA_API_USERNAME;
    const pass = process.env.DUDA_API_PASSWORD;
  
    console.log('DUDA_API_USERNAME:', uname || 'missing');
    console.log('DUDA_API_PASSWORD:', pass ? 'set' : 'missing');
  
    if (!uname || !pass) {
      console.error('Missing Duda credentials');
      return res.status(500).json({ error: 'Missing Duda credentials' });
    }
  
    const credentials = Buffer.from(`${uname}:${pass}`).toString('base64');
    const dudaApiUrl = 'https://api.duda.co/api/sites/multiscreen?offset=0&limit=75&sort=CREATION_DATE&direction=DESC';
  
    try {
      const response = await fetch(dudaApiUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Basic ${credentials}`
        }
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Duda API Error:', errorText);
        return res.status(response.status).json({ error: 'Duda API request failed', details: errorText });
      }
  
      const data = await response.json();
      res.status(200).json(data);
  
    } catch (err) {
      console.error('Unexpected server error:', err);
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  }
  