const getBrowserName = () => {
  const userAgent = navigator.userAgent || '';
  const brands = navigator.userAgentData?.brands || [];
  const brandNames = brands.map((brand) => brand.brand).join(' ');

  if (brandNames.includes('Edge')) return 'Edge';
  if (brandNames.includes('Brave')) return 'Brave';
  if (brandNames.includes('Opera')) return 'Opera';
  if (brandNames.includes('Samsung Internet')) return 'Samsung Internet';
  if (/EdgA?/.test(userAgent)) return 'Edge';
  if (/OPR/.test(userAgent)) return 'Opera';
  if (/Firefox/.test(userAgent)) return 'Firefox';
  if (/Chrome/.test(userAgent) && !/Safari/.test(userAgent)) return 'Chrome';
  if (/Safari/.test(userAgent)) return 'Safari';

  return 'Unknown';
};

const getBrowserVersion = () => {
  const userAgentData = navigator.userAgentData;
  if (userAgentData?.brands?.length) {
    const match = userAgentData.brands.find((brand) => brand.brand === 'Chromium' || brand.brand === 'Microsoft Edge' || brand.brand === 'Google Chrome');
    if (match && match.version) return match.version;
  }

  const userAgent = navigator.userAgent || '';
  const patterns = [
    /(?:Chrome|CriOS)\/(\d+(?:\.\d+)*)/,
    /(?:Firefox|FxiOS)\/(\d+(?:\.\d+)*)/,
    /(?:EdgA?|EdgiOS)\/(\d+(?:\.\d+)*)/,
    /Version\/(\d+(?:\.\d+)*)\s+Safari/
  ];

  for (const pattern of patterns) {
    const match = userAgent.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
};

const getOSInfo = () => {
  const userAgentData = navigator.userAgentData;
  const platform = userAgentData?.platform || navigator.platform || null;
  const userAgent = navigator.userAgent || '';

  if (userAgentData?.platformVersion) {
    return {
      os: platform || 'Unknown',
      osVersion: userAgentData.platformVersion || null
    };
  }

  if (/Windows/i.test(userAgent)) {
    return {
      os: 'Windows',
      osVersion: /Windows NT 10\.0/.test(userAgent) ? '10' : /Windows NT 6\.3/.test(userAgent) ? '8.1' : /Windows NT 6\.1/.test(userAgent) ? '7' : null
    };
  }

  if (/Mac OS X/i.test(userAgent)) {
    const versionMatch = userAgent.match(/Mac OS X ([0-9_]+)/i);
    return {
      os: 'macOS',
      osVersion: versionMatch ? versionMatch[1].replace(/_/g, '.') : null
    };
  }

  if (/Android/i.test(userAgent)) {
    const versionMatch = userAgent.match(/Android\s+([0-9.]+)/i);
    return {
      os: 'Android',
      osVersion: versionMatch ? versionMatch[1] : null
    };
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const versionMatch = userAgent.match(/OS\s+([0-9_]+)/i);
    return {
      os: /iPad|iPhone|iPod/.test(userAgent) ? 'iOS' : 'iOS',
      osVersion: versionMatch ? versionMatch[1].replace(/_/g, '.') : null
    };
  }

  if (/Linux/i.test(userAgent)) {
    return { os: 'Linux', osVersion: null };
  }

  return { os: platform || 'Unknown', osVersion: null };
};

const getDeviceType = () => {
  const userAgent = navigator.userAgent || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isTablet = /iPad|Android\s+(?:.+\s)?(Tablet|Tab)/i.test(userAgent) || (/Android/i.test(userAgent) && maxTouchPoints > 1 && window.innerWidth >= 600);

  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return 'mobile';
  if (isTablet || (/iPad/i.test(userAgent) && maxTouchPoints > 0)) return 'tablet';
  if (maxTouchPoints > 0 && window.innerWidth < 1100) return 'tablet';
  return 'desktop';
};

const getCapabilities = () => {
  const results = {
    webgl: false,
    webgl2: false,
    webAssembly: typeof WebAssembly !== 'undefined',
    webSocket: typeof WebSocket !== 'undefined',
    indexedDB: 'indexedDB' in window,
    localStorage: (() => { try { return !!window.localStorage; } catch (error) { return false; } })(),
    sessionStorage: (() => { try { return !!window.sessionStorage; } catch (error) { return false; } })(),
    serviceWorker: 'serviceWorker' in navigator,
    webWorkers: typeof Worker !== 'undefined',
    rtcPeerConnection: 'RTCPeerConnection' in window || 'webkitRTCPeerConnection' in window,
    notifications: 'Notification' in window,
    geolocation: 'geolocation' in navigator
  };

  try {
    const canvas = document.createElement('canvas');
    const webglContext = canvas.getContext('webgl');
    results.webgl = !!webglContext;
    const webgl2Context = canvas.getContext('webgl2');
    results.webgl2 = !!webgl2Context;
    if (webglContext) {
      const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        results.gpuVendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        results.gpuRenderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (error) {
    results.webgl = false;
    results.webgl2 = false;
  }

  return results;
};

const getConnectionInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

  return {
    type: connection?.type || null,
    effectiveType: connection?.effectiveType || null,
    downlink: connection?.downlink || null,
    rtt: connection?.rtt || null,
    saveData: typeof connection?.saveData === 'boolean' ? connection.saveData : null,
    online: navigator.onLine
  };
};

const getStatusMap = (payload) => ({
  available: payload !== null && payload !== undefined && payload !== '' ? 'available' : 'unavailable'
});

export const collectClientInfo = async () => {
  const screen = window.screen || {};
  const osInfo = getOSInfo();
  const capabilities = getCapabilities();

  const payload = {
    browser: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      userAgent: navigator.userAgent || null,
      platform: navigator.userAgentData?.platform || navigator.platform || null,
      language: navigator.language || null,
      languages: Array.isArray(navigator.languages) ? navigator.languages.slice(0, 10) : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      userAgentData: navigator.userAgentData ? {
        mobile: navigator.userAgentData.mobile || false,
        platform: navigator.userAgentData.platform || null,
        architecture: navigator.userAgentData.architecture || null,
        bitness: navigator.userAgentData.bitness || null,
        brands: navigator.userAgentData.brands || []
      } : {}
    },
    system: {
      os: osInfo.os,
      osVersion: osInfo.osVersion,
      architecture: navigator.userAgentData?.architecture || null,
      cpuCores: navigator.hardwareConcurrency || null,
      cpuModel: null,
      ramGB: typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null,
      deviceType: getDeviceType()
    },
    device: {
      type: getDeviceType(),
      touchSupport: navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0
    },
    screen: {
      width: screen.width || null,
      height: screen.height || null,
      availableWidth: screen.availWidth || null,
      availableHeight: screen.availHeight || null,
      viewportWidth: window.innerWidth || null,
      viewportHeight: window.innerHeight || null,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth || null,
      orientation: screen.orientation?.type || null
    },
    connection: getConnectionInfo(),
    capabilities: {
      webgl: capabilities.webgl,
      webgl2: capabilities.webgl2,
      webAssembly: capabilities.webAssembly,
      webSocket: capabilities.webSocket,
      indexedDB: capabilities.indexedDB,
      localStorage: capabilities.localStorage,
      sessionStorage: capabilities.sessionStorage,
      serviceWorker: capabilities.serviceWorker,
      webWorkers: capabilities.webWorkers,
      rtcPeerConnection: capabilities.rtcPeerConnection,
      notifications: capabilities.notifications,
      geolocation: capabilities.geolocation,
      gpuVendor: capabilities.gpuVendor || null,
      gpuRenderer: capabilities.gpuRenderer || null
    },
    status: {
      browser: {
        ...getStatusMap(payload.browser.name),
        version: getStatusMap(getBrowserVersion()),
        userAgent: getStatusMap(navigator.userAgent),
        platform: getStatusMap(navigator.userAgentData?.platform || navigator.platform),
        language: getStatusMap(navigator.language),
        languages: Array.isArray(navigator.languages) ? 'available' : 'unavailable',
        timezone: getStatusMap(Intl.DateTimeFormat().resolvedOptions().timeZone)
      },
      system: {
        os: getStatusMap(osInfo.os),
        osVersion: getStatusMap(osInfo.osVersion),
        architecture: getStatusMap(navigator.userAgentData?.architecture),
        cpuCores: getStatusMap(navigator.hardwareConcurrency),
        cpuModel: 'not_exposed_by_browser',
        ramGB: typeof navigator.deviceMemory === 'number' ? 'estimated' : 'unavailable'
      },
      device: {
        type: getStatusMap(getDeviceType()),
        touchSupport: getStatusMap(navigator.maxTouchPoints),
        maxTouchPoints: getStatusMap(navigator.maxTouchPoints)
      },
      screen: {
        width: getStatusMap(screen.width),
        height: getStatusMap(screen.height),
        availableWidth: getStatusMap(screen.availWidth),
        availableHeight: getStatusMap(screen.availHeight),
        viewportWidth: getStatusMap(window.innerWidth),
        viewportHeight: getStatusMap(window.innerHeight),
        pixelRatio: getStatusMap(window.devicePixelRatio),
        colorDepth: getStatusMap(screen.colorDepth),
        orientation: getStatusMap(screen.orientation?.type)
      },
      connection: {
        type: getStatusMap(connection?.type),
        effectiveType: getStatusMap(connection?.effectiveType),
        downlink: getStatusMap(connection?.downlink),
        rtt: getStatusMap(connection?.rtt),
        saveData: getStatusMap(connection?.saveData),
        online: getStatusMap(navigator.onLine)
      },
      capabilities: {
        webgl: capabilities.webgl ? 'available' : 'unavailable',
        webgl2: capabilities.webgl2 ? 'available' : 'unavailable',
        webAssembly: capabilities.webAssembly ? 'available' : 'unavailable',
        webSocket: capabilities.webSocket ? 'available' : 'unavailable',
        indexedDB: capabilities.indexedDB ? 'available' : 'unavailable',
        localStorage: capabilities.localStorage ? 'available' : 'unavailable',
        sessionStorage: capabilities.sessionStorage ? 'available' : 'unavailable',
        serviceWorker: capabilities.serviceWorker ? 'available' : 'unavailable',
        webWorkers: capabilities.webWorkers ? 'available' : 'unavailable',
        rtcPeerConnection: capabilities.rtcPeerConnection ? 'available' : 'unavailable',
        notifications: capabilities.notifications ? 'available' : 'unavailable',
        geolocation: capabilities.geolocation ? 'available' : 'unavailable',
        gpuVendor: capabilities.gpuVendor ? 'available' : 'unavailable',
        gpuRenderer: capabilities.gpuRenderer ? 'available' : 'unavailable'
      }
    }
  };

  return payload;
};

export const sendClientInfo = async (apiBaseUrl = '') => {
  try {
    const payload = await collectClientInfo();
    const endpoint = `${apiBaseUrl || 'http://localhost:5000'}/api/client-info`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.warn('Client info submission failed:', errorBody.error || response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.warn('Client info collection was skipped gracefully:', error.message);
    return null;
  }
};
