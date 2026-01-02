function apiKeyGuard(request, reply, done) {
  const apiKey = request.headers["x-api-key"];

  if (!apiKey) {
    return reply.code(401).send({
      error: "API key ausente",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return reply.code(403).send({
      error: "API key inválida",
    });
  }

  done();
}

export { apiKeyGuard };
