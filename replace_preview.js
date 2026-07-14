const fs = require('fs');
const file = 'D:/chandrasekar/PRODUCTIVITY-APP1/src/app/components/InvoicesView.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Physical Page Simulation Container */}'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</div>') && lines[i+1].includes('</div>') && lines[i+2].includes('</div>') && lines[i+4] && lines[i+4].includes('}'));

if (startIdx !== -1 && endIdx !== -1) {
  const replacement =                 {/* Shared PDF Renderer Preview */}
                <div style={{ width: '100%', height: '100%', minHeight: '680px', borderRadius: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  {livePdfUrl ? (
                    <iframe src={livePdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Live Preview PDF" />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Generating preview...
                    </div>
                  )}
                </div>;
  const newLines = [...lines.slice(0, startIdx), replacement, ...lines.slice(endIdx + 1)];
  fs.writeFileSync(file, newLines.join('\n'), 'utf8');
  console.log('Replaced from', startIdx, 'to', endIdx);
} else {
  console.log('Could not find bounds', startIdx, endIdx);
}
