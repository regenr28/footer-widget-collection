export default async function handler(req, res) {
    const DUDA_API_USERNAME = process.env.DUDA_API_USERNAME;
    const DUDA_API_PASSWORD = process.env.DUDA_API_PASSWORD;
  
    // You must pass ?site_name=xxxx in the request from your widget!
    const { site_name } = req.query;
  
    if (!site_name) {
      return res.status(400).json({ error: 'Missing required parameter: site_name' });
    }
  
    const dudaApiUrl = `https://api.duda.co/api/sites/multiscreen/${site_name}/collections`;
  
    try {
      const response = await fetch(dudaApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${DUDA_API_USERNAME}:${DUDA_API_PASSWORD}`).toString('base64'),
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`Duda API error: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Return the collections list to your Duda widget
      res.status(200).json(data);
  
    } catch (error) {
      console.error('Error fetching collections:', error.message);
      res.status(500).json({ error: error.message });
    }
  }