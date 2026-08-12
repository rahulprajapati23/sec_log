export default function DeviceDiagnostics({ info }) {
  if (!info) return null

  const browser = info.browser || {}
  const system = info.system || {}
  const device = info.device || {}
  const screen = info.screen || {}
  const connection = info.connection || {}
  const capabilities = info.capabilities || {}
  const server = info.server || {}

  const rows = [
    ['IP', server.publicIp || 'Waiting for proxy IP', server.ipVersion || 'n/a'],
    ['Browser', browser.name || 'Unknown', browser.version || 'n/a'],
    ['OS', system.os || 'Unknown', system.osVersion || 'n/a'],
    ['Platform', browser.platform || 'Unknown', system.architecture || 'n/a'],
    ['Device', device.type || 'Unknown', device.touchSupport ? 'Touch enabled' : 'No touch'],
    ['Screen', `${screen.width || 'n/a'}x${screen.height || 'n/a'}`, `${screen.viewportWidth || 'n/a'}x${screen.viewportHeight || 'n/a'}`],
    ['Memory', typeof system.ramGB === 'number' ? `${system.ramGB} GB (approx.)` : 'Not exposed', system.cpuCores ? `${system.cpuCores} cores` : 'n/a'],
    ['Network', connection.effectiveType || 'n/a', connection.type || 'n/a'],
    ['Timezone', browser.timezone || 'n/a', browser.language || 'n/a'],
    ['WebGL', capabilities.webgl ? 'Yes' : 'No', capabilities.webgl2 ? 'WebGL2' : 'WebGL1 only'],
    ['WebAssembly', capabilities.webAssembly ? 'Yes' : 'No', 'WebSocket: ' + (capabilities.webSocket ? 'Yes' : 'No')]
  ]

  return (
    <section className="device-diagnostics" aria-label="Device diagnostics panel">
      <h3>Environment diagnostics</h3>
      <div className="diagnostic-grid">
        {rows.map(([label, valueA, valueB]) => (
          <div className="diagnostic-row" key={label}>
            <span className="diag-label">{label}</span>
            <strong>{valueA}</strong>
            <span>{valueB}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
