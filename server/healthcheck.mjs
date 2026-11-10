// Distroless has no shell, wget or curl. Probe both the server and its built entry page.
try {
  const response = await fetch(`http://127.0.0.1:${process.env.PORT || 5173}/`, {
    method: 'HEAD',
    signal: AbortSignal.timeout(2000),
  });
  const healthy = response.status === 200
    && response.headers.get('content-type')?.startsWith('text/html')
    && Number(response.headers.get('content-length')) > 0;
  if (!healthy) throw new Error(`Unexpected response: HTTP ${response.status}`);
} catch (error) {
  console.error(`Healthcheck failed: ${error.message}`);
  process.exitCode = 1;
}
