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

declare interface ImportMeta {
  shoeshine<T extends {
    [K in keyof T]: K extends keyof ShoeshineConfig ? ShoeshineConfig[K] : never
  }>(): [string, T]

  shoeshine<T extends {
    [K in keyof T]: K extends keyof ShoeshineConfigMulti ? ShoeshineConfigMulti[K] : never
  }>(): Record<ShoeshineFormat, [string, ShoeshineConfig]>
}
