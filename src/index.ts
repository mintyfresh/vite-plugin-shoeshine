import jwt, { SignOptions } from 'jsonwebtoken'
import MagicString from 'magic-string'
import { Plugin } from 'vite'

const encodeShoeshineConfig = (config: ShoeshineConfig, signingKey: string, signOptions?: SignOptions): string => {
  const payload = {
    sz: config.size,
    fmt: config.format,
    rsz: config.resize,
    g: config.gravity,
  }

  return jwt.sign(
    payload,
    signingKey,
    signOptions ?? {
      algorithm: 'HS256',
      expiresIn: '180 days'
    }
  )
}

const generateShoeshineFunction = (config: ShoeshineConfig, signingKey: string, signOptions?: SignOptions): string => (
  `(
    function() {
      return [
        \`${encodeShoeshineConfig(config, signingKey, signOptions)}\`,
        {
          ...${JSON.stringify(config)},
          get width() { return this.size?.[0] },
          get height() { return this.size?.[1] },
        }
      ];
    }
  )`
)

const generateShoeshineFunctionMulti = (config: ShoeshineConfigMulti, signingKey: string, signOptions?: SignOptions): string => (
  `(
    function() {
      return {
        ${config.formats.map((format) => (
          `"${format}": [
            \`${encodeShoeshineConfig({ ...config, format }, signingKey, signOptions)}\`,
            {
              ...${JSON.stringify({ ...config, formats: undefined, format })},
              get width() { return this.size?.[0] },
              get height() { return this.size?.[1] },
            }
          ]`
        )).join(',\n')}
      };
    }
  )`
)

export default function vitePluginShoeshine(signingKey: string, signOptions?: SignOptions): Plugin {
  let sourceMapsEnabled = false

  return {
    name: 'vite-plugin-shoeshine',
    enforce: 'pre',

    configResolved(config: any) {
      sourceMapsEnabled = !!config.build.sourcemap
    },

    transform(src: string, id: string) {
      if (id.includes('node_modules')) {
        return
      }

      if (!/\.(js|ts|tsx|mjs)$/.test(id)) {
        return
      }

      const requests = [...src.matchAll(/import\.meta\.shoeshine\<([^>]+)\>/g)]

      if (requests.length === 0) {
        return
      }

      const code = new MagicString(src)

      requests.forEach((request) => {
        const start = request.index!
        const end = start + request[0].length

        const config: ShoeshineConfig | ShoeshineConfigMulti = new Function(`return (${request[1]})`)()

        if ('formats' in config) {
          const shoeshine = generateShoeshineFunctionMulti(config, signingKey, signOptions)
          code.overwrite(start, end, shoeshine)
        } else {
          const shoeshine = generateShoeshineFunction(config, signingKey, signOptions)
          code.overwrite(start, end, shoeshine)
        }
      })

      return {
        code: code.toString(),
        map: sourceMapsEnabled ? code.generateMap({ source: id }) : null,
      }
    }
  }
}
