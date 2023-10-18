import jwt, { SignOptions } from 'jsonwebtoken'
import MagicString from 'magic-string'
import { Plugin } from 'vite'

const encodeShoeshineConfig = (config: ShoeshineConfig, signingKey: string, signOptions?: SignOptions): string => {
  const payload = {
    sz: config.size,
    fmt: config.format,
    rsz: config.resize,
    g: config.gravity,
    q: config.quality,
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

const generateShoeshineImageFunction = (config: ShoeshineConfig, signingKey: string, signOptions?: SignOptions): string => (
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

const generateShoeshineMultiFunction = (config: ShoeshineConfigMulti, signingKey: string, signOptions?: SignOptions): string => (
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

const generateShoeshineVariantsFunction = (config: ShoeshineConfigVariants, signingKey: string, signOptions?: SignOptions): string => (
  `(
    function() {
      return {
        ${Object.keys(config).map((variant) => (
          `"${variant}": {
            ${config[variant].formats.map((format) => (
              `"${format}": [
                \`${encodeShoeshineConfig({ ...config[variant], format }, signingKey, signOptions)}\`,
                {
                  ...${JSON.stringify({ ...config[variant], formats: undefined, format })},
                  get width() { return this.size?.[0] },
                  get height() { return this.size?.[1] },
                }
              ]`
            )).join(',\n')}
          }`
        )).join(',\n')}
      }
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

      const requests = [...src.matchAll(/shoeshine\.(image|multi|variants)\<([^>]+)\>/g)]

      if (requests.length === 0) {
        return
      }

      const code = new MagicString(src)

      requests.forEach((request) => {
        const start = request.index!
        const end = start + request[0].length

        let generated = null;
        const config = new Function(`return (${request[2]})`)()

        switch (request[1]) {
          case 'image': {
            generated = generateShoeshineImageFunction(config, signingKey, signOptions)
            break;
          }

          case 'multi': {
            generated = generateShoeshineMultiFunction(config, signingKey, signOptions)
            break;
          }

          case 'variants': {
            generated = generateShoeshineVariantsFunction(config, signingKey, signOptions)
            break;
          }

          default:
            throw new Error(`Unknown shoeshine request type: ${request[1]}`)
        }

        code.overwrite(start, end, generated)
      })

      return {
        code: code.toString(),
        map: sourceMapsEnabled ? code.generateMap({ source: id }) : null,
      }
    }
  }
}
