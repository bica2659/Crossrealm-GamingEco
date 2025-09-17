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

  // Demo active games
  const demoGames = [
    {
      id: 1,
      gameType: 'chess',
      stake: '0.5',
      creator: { username: 'ChessMaster', rating: 1847 },
      timeControl: 'blitz',
      status: 'waiting',
      players: [{ username: 'ChessMaster', rating: 1847 }],
      description: 'Quick blitz game, all welcome!',
      createdAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 2,
      gameType: 'checkers',
      stake: '1.0', 
      creator: { username: 'CheckerKing', rating: 1654 },
      timeControl: 'rapid',
      status: 'waiting',
      players: [{ username: 'CheckerKing', rating: 1654 }],
      description: 'Serious checkers match',
      createdAt: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 3,
      gameType: 'chess',
      stake: '2.0',
      creator: { username: 'GrandMaster', rating: 1923 },
      timeControl: 'classical', 
      status: 'active',
      players: [
        { username: 'GrandMaster', rating: 1923 },
        { username: 'ChessGM', rating: 1856 }
      ],
      description: 'High stakes classical game',
      createdAt: new Date(Date.now() - 900000).toISOString()
    }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      games: demoGames,
      total: demoGames.length
    })
  };
};
