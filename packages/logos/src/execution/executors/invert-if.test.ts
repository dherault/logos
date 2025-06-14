import path from 'node:path'

import { describe, expect, test } from '@jest/globals'

import { execute } from '~execution/execute'
// import { applyFix } from '~execution/applyFix'

import { createProject } from '~project/createProject'
import { addSourceFileToProject } from '~project/addSourceFileToProject'

const NoFilesTsConfigPath = path.join(__dirname, '../../test-projects/no-files/tsconfig.json')

function createProjectWithFile(fileContent: string) {
  const project = createProject(NoFilesTsConfigPath)

  addSourceFileToProject(project, 'index.ts', fileContent)

  return project
}

function expectInvertIf(code: string, cursors: number[] = []) {
  const project = createProjectWithFile(code)
  const results = execute(project)

  expect(results).toHaveLength(1)
  expect(results[0].code).toBe('invert-if')
  expect(results[0].message).toBe('Invert if statement to reduce nesting.')
  expect(results[0].filePath).toMatch(/index.ts$/)
  expect(results[0].relativeFilePath).toBe('index.ts')

  if (cursors.length) {
    expect(results[0].line).toBe(cursors[0])
    expect(results[0].start).toBe(cursors[1])
    expect(results[0].end).toBe(cursors[2])
  }
}

function expectNoInvertIf(code: string) {
  const project = createProjectWithFile(code)
  const results = execute(project)

  expect(results).toHaveLength(0)
}

describe('Inverting ifs', () => {

  test('Suggests inverting simple ifs 1', () => {
    expectInvertIf(`
      function main() {
        const a = Math.random();

        if (a > 0.5) {
          console.log('Yes');
        }
      }
    `,
    [5, 67, 69]
    )
    // expect(results[0].fix).toBeDefined()
    // expect(results[0].fix?.start).toBe(23)
    // expect(results[0].fix?.end).toBe(129)
    // expect(results[0].fix?.content).toBe(`{
    //     const a = Math.random();
    //     if (a <= 0.5) {
    //       return;
    //     }
    //     console.log("Yes");
    //   }`)

    // expect(applyFix(project, results[0])).toBe(`
    //   function main() {
    //     const a = Math.random();

    //     if (a <= 0.5) {
    //       return;
    //     }

    //     console.log("Yes");
    //   }
    // `)
  })

  test('Suggests inverting nested ifs 1', () => {
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

    // expect(applyFix(project, results[0])).toBe(`
    //   function main() {
    //     const a = Math.random();

    //     if (a <= 0.5) {
    //       return;
    //     }

    //     const b = Math.random();
    //     if (b > 0.5) {
    //       console.log("Yes");
    //     }
    //   }
    // `)

    // expect(applyFix(project, results[1])).toBe(`
    //   function main() {
    //     const a = Math.random();

    //     if (a > 0.5) {
    //       const b = Math.random();

    //       if (b <= 0.5) {
    //         return;
    //       }

    //       console.log("Yes");
    //     }
    //   }
    // `)
  })

  test('Suggests inverting nested ifs 2', () => {
    expectInvertIf(`
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
  })

  test('Suggests inverting ifs with following return 1', () => {
    expectInvertIf(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')

          return true
        }

        return false
      }
    `)
  })

  test('Suggests inverting ifs with following return 2', () => {
    expectInvertIf(`
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
  })

  /* ---
    NO INVERSION
  --- */

  test('Does not suggest inverting simple ifs 1', () => {
    expectNoInvertIf(`
      function main() {
        const a = Math.random()

        if (a > 0.5) {
          console.log('Yes')
        }

        console.log('No')
      }
    `)
  })

  test('Does not suggest inverting simple ifs 2', () => {
    expectNoInvertIf(`
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
  })

  test('Does not suggest inverting simple ifs 3', () => {
    expectNoInvertIf(`
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
  })

})
