exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type", 
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Generate realistic demo stats
  const now = new Date();
  const seed = Math.floor(now.getTime() / (5 * 60 * 1000)); // Change every 5 minutes
  const random = (seed) => ((seed * 9301 + 49297) % 233280) / 233280;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      onlinePlayers: Math.floor(random(seed) * 300 + 200),
      activeGames: Math.floor(random(seed + 1) * 80 + 40),
      dailyVolume: (random(seed + 2) * 500 + 300).toFixed(1),
      totalPrizePool: (random(seed + 3) * 200 + 400).toFixed(1)
    })
  };
};
