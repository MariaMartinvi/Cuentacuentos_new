exports.handler = async function() { return { statusCode: 200, body: JSON.stringify({ message: "Funci¢n de prueba funcionando correctamente", timestamp: new Date().toISOString() }) }; }; 
