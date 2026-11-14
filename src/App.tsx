import { useMemo, useRef, useState } from 'react'
import { Camera, ClipboardList, Package, Truck, History, Plus, Search, Minus, Check, Trash2, Barcode, Users, Cloud, CloudOff } from 'lucide-react'
import { cloudEnabled } from './lib/supabase'
import type { Product, Supplier, OrderLine } from './types'

const suppliers: Supplier[] = [
  { id: 's1', name: 'Fornecedor principal' },
  { id: 's2', name: 'Fornecedor de bebidas' },
  { id: 's3', name: 'Outros fornecedores' }
]
const initialProducts: Product[] = [
  { id: 'p1', name: 'Água mineral 1,5 L', brand: 'Marca exemplo', barcode: '5600000000012', supplierId: 's2' },
  { id: 'p2', name: 'Leite meio-gordo 1 L', brand: 'Marca exemplo', barcode: '5600000000029', supplierId: 's1' },
  { id: 'p3', name: 'Guardanapos brancos', brand: 'Marca exemplo', barcode: '5600000000036', supplierId: 's3' }
]

type Tab = 'order' | 'products' | 'suppliers' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('order')
  const [products, setProducts] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem('so-products') || 'null') || initialProducts } catch { return initialProducts }
  })
  const [lines, setLines] = useState<OrderLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('so-lines') || '[]') } catch { return [] }
  })
  const [query, setQuery] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [newName, setNewName] = useState('')
  const [newBarcode, setNewBarcode] = useState('')
  const [newSupplier, setNewSupplier] = useState(suppliers[0].id)
  const [photo, setPhoto] = useState<string | undefined>()
  const [showAdd, setShowAdd] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const persistProducts = (next: Product[]) => {
    setProducts(next); localStorage.setItem('so-products', JSON.stringify(next))
  }
  const persistLines = (next: OrderLine[]) => {
    setLines(next); localStorage.setItem('so-lines', JSON.stringify(next))
  }
  const visibleProducts = useMemo(() => products.filter(p =>
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode?.includes(query)) &&
    (supplierFilter === 'all' || p.supplierId === supplierFilter)
  ), [products, query, supplierFilter])

  const addToOrder = (productId: string) => {
    const found = lines.find(l => l.productId === productId)
    persistLines(found
      ? lines.map(l => l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l)
      : [...lines, { productId, quantity: 1, checked: false }])
    setNotice('Produto adicionado à encomenda')
    setTimeout(() => setNotice(''), 1800)
  }
  const changeQty = (productId: string, delta: number) => {
    persistLines(lines.map(l => l.productId === productId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
  }
  const toggleChecked = (productId: string) => persistLines(lines.map(l => l.productId === productId ? { ...l, checked: !l.checked } : l))
  const removeLine = (productId: string) => persistLines(lines.filter(l => l.productId !== productId))
  const saveProduct = () => {
    if (!newName.trim()) return
    const item: Product = { id: crypto.randomUUID(), name: newName.trim(), barcode: newBarcode.trim() || undefined, supplierId: newSupplier, photo }
    persistProducts([item, ...products])
    setNewName(''); setNewBarcode(''); setPhoto(undefined); setShowAdd(false); setTab('products')
  }
  const onPhoto = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }
  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0)
  const activeLines = lines.filter(l => !l.checked).length

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><strong>Stock & Order</strong><small>GESTÃO DE ENCOMENDAS</small></div></div>
      <nav>
        <NavButton active={tab === 'order'} icon={<ClipboardList size={18}/>} label="Encomenda atual" onClick={() => setTab('order')} count={lines.length}/>
        <NavButton active={tab === 'products'} icon={<Package size={18}/>} label="Produtos" onClick={() => setTab('products')}/>
        <NavButton active={tab === 'suppliers'} icon={<Truck size={18}/>} label="Fornecedores" onClick={() => setTab('suppliers')}/>
        <NavButton active={tab === 'history'} icon={<History size={18}/>} label="Histórico" onClick={() => setTab('history')}/>
      </nav>
      <div className="sidebar-bottom"><div className="sync"><span className="sync-icon">{cloudEnabled ? <Cloud size={16}/> : <CloudOff size={16}/>}</span><span><b>{cloudEnabled ? 'Credenciais configuradas' : 'Modo local'}</b><small>{cloudEnabled ? 'Sincronização por implementar' : 'Dados guardados neste dispositivo'}</small></span></div><div className="team"><Users size={16}/> Partilha até 5 pessoas · por configurar</div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="mobile-brand"><div className="brand-mark">S</div><strong>Stock & Order</strong></div><span className="workspace">A minha loja <span className="dot"/></span><button className="avatar" title="Perfil">EU</button></header>
      <div className="content">
        {tab === 'order' && <>
          <div className="page-heading"><div><p className="eyebrow">ÁREA DE TRABALHO</p><h1>Encomenda atual</h1><p className="muted">Prepara os produtos que precisas de pedir aos fornecedores.</p></div><button className="primary" onClick={() => { setShowAdd(true); setTab('products') }}><Plus size={17}/> Adicionar produto</button></div>
          <section className="stats"><Stat label="Produtos na lista" value={String(lines.length).padStart(2,'0')}/><Stat label="Unidades necessárias" value={String(totalUnits).padStart(2,'0')}/><Stat label="Por confirmar" value={String(activeLines).padStart(2,'0')}/></section>
          <div className="section-head"><div><h2>Lista de encomenda</h2><p className="muted">Assinala os produtos à medida que os recolhes.</p></div><button className="subtle" onClick={() => { if (lines.length && confirm('Limpar a encomenda atual?')) persistLines([]) }}>Limpar lista</button></div>
          {lines.length === 0 ? <Empty title="Ainda não tens produtos na encomenda" detail="Vai ao catálogo ou fotografa um produto para começares." action={() => setTab('products')}/> :
            <div className="order-list">{lines.map(line => {
              const p = products.find(x => x.id === line.productId)
              if (!p) return null
              return <div className={`order-row ${line.checked ? 'is-checked' : ''}`} key={p.id}>
                <button className={`check ${line.checked ? 'checked' : ''}`} onClick={() => toggleChecked(p.id)}>{line.checked && <Check size={15}/>}</button>
                <div className="product-thumb">{p.photo ? <img src={p.photo} alt={p.name}/> : <Package size={22}/>}</div>
                <div className="product-info"><b>{p.name}</b><small>{p.brand || 'Sem marca'} · {suppliers.find(s => s.id === p.supplierId)?.name}</small>{p.barcode && <small className="barcode"><Barcode size={12}/>{p.barcode}</small>}</div>
                <div className="quantity"><button onClick={() => changeQty(p.id,-1)}><Minus size={14}/></button><b>{line.quantity}</b><button onClick={() => changeQty(p.id,1)}><Plus size={14}/></button></div>
                <button className="icon-button danger" onClick={() => removeLine(p.id)} aria-label="Remover"><Trash2 size={16}/></button>
              </div>
            })}</div>}
        </>}

        {tab === 'products' && <>
          <div className="page-heading"><div><p className="eyebrow">CATÁLOGO</p><h1>Produtos</h1><p className="muted">Guarda os produtos para os reutilizares nas próximas encomendas.</p></div><button className="primary" onClick={() => setShowAdd(!showAdd)}><Camera size={17}/> Fotografar / adicionar</button></div>
          {showAdd && <section className="add-panel"><div className="section-head"><div><h2>Novo produto</h2><p className="muted">Fotografa a embalagem e preenche os dados identificativos.</p></div><button className="subtle" onClick={() => setShowAdd(false)}>Fechar</button></div>
            <div className="add-grid"><div className="photo-upload" onClick={() => fileRef.current?.click()}>{photo ? <img src={photo} alt="Fotografia do novo produto"/> : <><Camera size={27}/><b>Adicionar fotografia</b><small>Tirar foto ou escolher da galeria</small></>}<input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e => onPhoto(e.target.files?.[0])}/></div>
              <div className="fields"><label>Nome do produto<input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex.: Água mineral 1,5 L"/></label><label>Código de barras (EAN)<input value={newBarcode} onChange={e => setNewBarcode(e.target.value)} placeholder="Introduzir código EAN" inputMode="numeric" maxLength={14}/></label><label>Fornecedor<select value={newSupplier} onChange={e => setNewSupplier(e.target.value)}>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="primary" onClick={saveProduct} disabled={!newName.trim()}>Guardar produto</button></div>
            </div><p className="hint">Nesta primeira versão, a fotografia fica associada ao produto. O reconhecimento automático e a leitura EAN serão ligados na próxima etapa.</p>
          </section>}
          <div className="filters"><div className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar por nome ou código de barras"/></div><select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}><option value="all">Todos os fornecedores</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="catalog">{visibleProducts.map(p => <div className="catalog-card" key={p.id}><div className="catalog-photo">{p.photo ? <img src={p.photo} alt={p.name}/> : <Package size={26}/>}</div><div className="catalog-info"><b>{p.name}</b><small>{suppliers.find(s => s.id === p.supplierId)?.name}</small>{p.barcode && <small className="barcode"><Barcode size={12}/>{p.barcode}</small>}</div><button className="add-round" onClick={() => addToOrder(p.id)} title="Adicionar à encomenda"><Plus size={18}/></button></div>)}</div>
          {visibleProducts.length === 0 && <Empty title="Não encontrámos produtos" detail="Experimenta outra pesquisa ou adiciona um produto novo." action={() => setShowAdd(true)}/>}
        </>}

        {tab === 'suppliers' && <><div className="page-heading"><div><p className="eyebrow">GESTÃO</p><h1>Fornecedores</h1><p className="muted">Os produtos ficam associados ao respetivo fornecedor.</p></div></div><div className="supplier-list">{suppliers.map(s => <div className="supplier-row" key={s.id}><div className="supplier-icon"><Truck size={20}/></div><div><b>{s.name}</b><small>{products.filter(p => p.supplierId === s.id).length} produtos no catálogo</small></div></div>)}</div><p className="hint">Os nomes apresentados são exemplos. A gestão de fornecedores personalizados será incluída na próxima iteração.</p></>}
        {tab === 'history' && <><div className="page-heading"><div><p className="eyebrow">REGISTOS</p><h1>Histórico</h1><p className="muted">Consulta encomendas que já foram concluídas.</p></div></div><Empty title="Ainda não existem encomendas anteriores" detail="Quando terminares uma encomenda, poderás guardá-la aqui."/> </>}
      </div>
      {notice && <div className="toast">{notice}</div>}
    </main>
    <nav className="mobile-nav"><NavButton active={tab === 'order'} icon={<ClipboardList/>} label="Encomenda" onClick={() => setTab('order')}/><NavButton active={tab === 'products'} icon={<Package/>} label="Produtos" onClick={() => setTab('products')}/><NavButton active={tab === 'suppliers'} icon={<Truck/>} label="Fornecedores" onClick={() => setTab('suppliers')}/><NavButton active={tab === 'history'} icon={<History/>} label="Histórico" onClick={() => setTab('history')}/></nav>
  </div>
}

function NavButton({ active, icon, label, onClick, count }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; count?: number }) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{count ? <em>{count}</em> : null}</button>
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="stat"><small>{label}</small><strong>{value}</strong></div> }
function Empty({ title, detail, action }: { title: string; detail: string; action?: () => void }) { return <div className="empty"><div className="empty-icon"><Package size={24}/></div><b>{title}</b><p>{detail}</p>{action && <button className="secondary" onClick={action}>Ver produtos</button>}</div> }