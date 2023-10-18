type ShoeshineSize = [number, number]
type ShoeshineFormat = 'jpeg' | 'png' | 'webp'
type ShoeshineResize = 'fit' | 'fill' | 'limit'
type ShoeshineGravity =
  'north' | 'east' | 'south' | 'west' |
  'north-east' | 'south-east' | 'south-west' | 'north-west' |
  'center'

interface ShoeshineConfig {
  size?: ShoeshineSize,
  format?: ShoeshineFormat,
  resize?: ShoeshineResize,
  gravity?: ShoeshineGravity,
  quality?: number,
}

interface ShoeshineConfigMulti {
  formats: ShoeshineFormat[],
  size?: ShoeshineSize,
  resize?: ShoeshineResize,
  gravity?: ShoeshineGravity,
  quality?: number,
}

interface ShoeshineConfigVariants {
  [key: string]: ShoeshineConfigMulti
}

declare class shoeshine {
  static image<T extends {
    [K in keyof T]: K extends keyof ShoeshineConfig ? ShoeshineConfig[K] : never
  }>(): [string, T]

  static multi<T extends {
    [K in keyof T]: K extends keyof ShoeshineConfigMulti ? ShoeshineConfigMulti[K] : never
  }>(): Record<ShoeshineFormat, [string, ShoeshineConfig]>

  static variants<T extends {
    [V in keyof T]: {
      [K in keyof T[V]]: K extends keyof ShoeshineConfigMulti ? ShoeshineConfigMulti[K] : never
    }
  }>(): Record<keyof T, Record<ShoeshineFormat, [string, ShoeshineConfig]>>
}
