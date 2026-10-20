import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { compactPromptIcons } from './compact-prompt-icons.mjs'

const require = createRequire(import.meta.url)
const path = require.resolve('metanet-react-prompt').replace(/out\/src\/index\.js$/, 'out/src/components/DownloadButton.js')

describe('prompt icon startup import', () => {
  it('rewrites the installed dependency to its single used icon', () => {
    const source = readFileSync(path, 'utf8')
    const result = compactPromptIcons().transform(source, path)
    expect(result.code).not.toContain('require("@mui/icons-material")')
    expect(result.code).toContain('require("@mui/icons-material/KeyboardArrowDownOutlined").default')
    expect(result.code).toContain('icons_material_1.KeyboardArrowDownOutlined')
  })

  it('does not rewrite application imports or another dependency', () => {
    expect(compactPromptIcons().transform('require("@mui/icons-material")', '/other/DownloadButton.js')).toBeNull()
  })

  it('rejects changed imports or additional icon usage instead of emitting a broken UI', () => {
    const source = readFileSync(path, 'utf8')
    for (const changed of [source.replace('const icons_material_1', 'const renamed'), source + '\nicons_material_1.UnexpectedIcon;']) {
      expect(() => compactPromptIcons().transform(changed, path)).toThrow(/implementation changed/)
    }
  })
})
