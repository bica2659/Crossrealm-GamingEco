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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const gameData = JSON.parse(event.body);
    
    // Demo response - in production, this would interact with your contract
    const newGame = {
      id: Date.now(),
      gameType: gameData.gameType,
      stake: gameData.stake,
      timeControl: gameData.timeControl,
      status: 'waiting',
      players: 1,
      maxPlayers: 2,
      contractAddress: '0x7af2cB8f93D0a75E0ba39E974B4e968EAe49028A',
      createdAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        game: newGame
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Invalid game data'
      })
    };
  }
};
