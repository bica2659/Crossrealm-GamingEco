exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(Math.random() * 3600),
      platform: 'Netlify Functions'
    })
  };
};
