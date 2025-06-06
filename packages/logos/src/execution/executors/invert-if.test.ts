import path from 'node:path'

import { describe, expect, test } from '@jest/globals'

import { execute } from '~execution/execute'
import { applyFix } from '~execution/applyFix'

import { createProject } from '~project/createProject'
import { addSourceFileToProject } from '~project/addSourceFileToProject'

const NoFilesTsConfigPath = path.join(__dirname, '../../test-projects/no-files/tsconfig.json')

describe('Inverting ifs', () => {

  function createProjectWithFile(fileContent: string) {
    const project = createProject(NoFilesTsConfigPath)

    addSourceFileToProject(project, 'index.ts', fileContent)

    return project
  }

  test('Suggests inverting simple ifs 1', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random();

        if (a > 0.5) {
          console.log('Yes');
        }
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(1)
    expect(results[0].code).toBe('invert-if')
    expect(results[0].message).toBe('Invert if statement to reduce nesting.')
    expect(results[0].filePath).toMatch(/index.ts$/)
    expect(results[0].relativeFilePath).toBe('index.ts')
    expect(results[0].line).toBe(5)
    expect(results[0].start).toBe(67)
    expect(results[0].end).toBe(69)
    expect(results[0].fix).toBeDefined()
    expect(results[0].fix?.start).toBe(23)
    expect(results[0].fix?.end).toBe(129)
    expect(results[0].fix?.content).toBe(`{
        const a = Math.random();

        if (a <= 0.5) {
          return;
        }

        console.log("Yes");
      }`)

    expect(applyFix(project, results[0])).toBe(`
      function main() {
        const a = Math.random();

        if (a <= 0.5) {
          return;
        }

        console.log("Yes");
      }
    `)
  })

  test('Suggests inverting simple ifs 2', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random();

        if (a > 0.5) {
          const b = Math.random();

          if (b > 0.5) {
            console.log('Yes');
          }
        }
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(2)
    expect(results[0].code).toBe('invert-if')
    expect(results[1].code).toBe('invert-if')

    expect(applyFix(project, results[0])).toBe(`
      function main() {
        const a = Math.random();

        if (a <= 0.5) {
          return;
        }

        const b = Math.random();
        if (b > 0.5) {
          console.log("Yes");
        }
      }
    `)

    expect(applyFix(project, results[1])).toBe(`
      function main() {
        const a = Math.random();

        if (a > 0.5) {
          const b = Math.random();

          if (b <= 0.5) {
            return;
          }

          console.log("Yes");
        }
      }
    `)
  })

  test('Suggests inverting simple ifs 3', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random();

        if (a > 0.5) {
          const b = Math.random()

          if (b > 0.5) {
            console.log('Yes')
          }

          console.log('No')
        }
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(1)
    expect(results[0].code).toBe('invert-if')
  })

  test('Suggests inverting ifs with following return 1', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')

          return true
        }

        return false
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(1)
    expect(results[0].code).toBe('invert-if')
  })

  test('Suggests inverting ifs with following return 2', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')
          console.log('Yes')

          return true
        }

        return false
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(1)
    expect(results[0].code).toBe('invert-if')
  })

  test('Does not suggest inverting ifs 1', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')
        }

        console.log('No')
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(0)
  })

  test('Does not suggest inverting ifs 2', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')
        }
        else {
          console.log('No')
        }
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(0)
  })

  test('Does not suggest inverting ifs 3', () => {
    const project = createProjectWithFile(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')

          return true
        }

        console.log('No')

        return false
      }
    `)

    const results = execute(project)

    expect(results).toHaveLength(0)
  })

})
