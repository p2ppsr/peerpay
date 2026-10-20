// metanet-react-prompt 1.0.6 uses one icon through a CommonJS barrel require.
// That require retains the entire Material icon library in the startup bundle.
// Keep its behavior, replacing only this known import with the individual icon.
export function compactPromptIcons() {
  return {
    name: 'compact-metanet-prompt-icons',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/metanet-react-prompt/out/src/components/DownloadButton.js')) return null
      const original = 'const icons_material_1 = require("@mui/icons-material");'
      const uses = [...code.matchAll(/icons_material_1\.([A-Za-z0-9_]+)/g)].map(match => match[1])
      if (code.split(original).length !== 2 || !uses.length || uses.some(name => name !== 'KeyboardArrowDownOutlined')) {
        throw new Error('metanet-react-prompt icon implementation changed; review the narrow import before building')
      }
      return {
        code: code.replace(original, 'const icons_material_1 = { KeyboardArrowDownOutlined: require("@mui/icons-material/KeyboardArrowDownOutlined").default };'),
        map: null,
      }
    },
  }
}
