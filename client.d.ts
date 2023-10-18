type ShoeshineSize = [number, number]
type ShoeshineFormat = 'jpg' | 'png' | 'webp'
type ShoeshineResize = 'fit' | 'fill' | 'limit'
type ShoeshineAnchor =
  'north' | 'east' | 'south' | 'west' |
  'north-east' | 'south-east' | 'south-west' | 'north-west' |
  'center'

interface ShoeshineConfig {
  size?: ShoeshineSize,
  format?: ShoeshineFormat,
  resize?: ShoeshineResize,
  anchor?: ShoeshineAnchor,
}

declare interface ImportMeta {
  shoeshine<T extends ShoeshineConfig>(): [string, T]
}
