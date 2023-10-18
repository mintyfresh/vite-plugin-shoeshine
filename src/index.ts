import jwt, { SignOptions } from 'jsonwebtoken'
import MagicString from 'magic-string'
import { Plugin } from 'vite'

const encodeShoeshineConfig = (config: any, signingKey: string, signOptions?: SignOptions): string => {
  const payload = {
    sz: config.size?.join('/'),
    fmt: config.format,
    rsz: config.resize,
    ank: config.anchor,
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

        const config = new Function(`return (${request[1]})`)()
        const encoded = encodeShoeshineConfig(config, signingKey, signOptions)

        const result = `(
          function() {
            return [
              \`${encoded}\`,
              {
                ...${JSON.stringify(config)},
                get width() { return this.size?.[0] },
                get height() { return this.size?.[1] },
              }
            ];
          }
        )`

        code.overwrite(start, end, result)
      })

      return {
        code: code.toString(),
        map: sourceMapsEnabled ? code.generateMap({ source: id }) : null,
      }
    }
  }
}
