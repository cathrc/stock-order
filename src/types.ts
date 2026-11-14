export type Supplier = { id: string; name: string }
export type Product = {
  id: string
  name: string
  brand?: string
  barcode?: string
  supplierId: string
  photo?: string
}
export type OrderLine = { productId: string; quantity: number; checked: boolean }
export type Order = { id: string; title: string; createdAt: string; lines: OrderLine[] }