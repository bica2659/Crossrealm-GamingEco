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

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      contractAddress: '0x7af2cB8f93D0a75E0ba39E974B4e968EAe49028A',
      network: 'Core Mainnet',
      chainId: 1116,
      rpcUrl: 'https://rpc.coredao.org/',
      blockExplorer: 'https://scan.coredao.org'
    })
  };
};
