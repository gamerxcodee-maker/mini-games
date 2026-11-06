/* Shared browser ICE configuration for all five online games.
 * Only browser-facing TURN credentials belong here. Never add an account API
 * secret or a provider management token to this public GitHub Pages file.
 * The provider's browser-facing relay credential is limited to the owner's
 * no-card 500MB trial. The provider stops relay traffic if its quota is reached.
 */
(() => {
  const relayServers = [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'turn:global.relay.metered.ca:80', username: '0b0b1f0a9b757559b188a2f4', credential: 'uCEJHhDZdzY4qi0/' },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: '0b0b1f0a9b757559b188a2f4', credential: 'uCEJHhDZdzY4qi0/' },
    { urls: 'turn:global.relay.metered.ca:443', username: '0b0b1f0a9b757559b188a2f4', credential: 'uCEJHhDZdzY4qi0/' },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: '0b0b1f0a9b757559b188a2f4', credential: 'uCEJHhDZdzY4qi0/' }
  ];
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }, ...relayServers];
  window.BrightArcadeMultiplayer = {
    connectionTimeoutMs: 30000,
    peerOptions: { secure: true, config: { iceServers } },
    hasRelay: relayServers.some(server => [server.urls].flat().some(url => /^turns?:/.test(url)))
  };
})();
