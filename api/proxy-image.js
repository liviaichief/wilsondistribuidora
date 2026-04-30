
export default async function handler(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');

    res.setHeader('Content-Type', contentType || 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
