'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  FileSpreadsheet,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface Product {
  name: string
  regular_price: string
  promo_price: string
  url: string
  image_url: string
  store: string
  error?: {
    code: number
    message: string
  }
}

interface StoreResult {
  store: string
  status: string
  products: Product[]
}

interface SearchResponse {
  query: string
  results?: Record<string, Product[]>
  error?: string
}

export default function ProductSearchApp() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState('all')
  const [searchMode, setSearchMode] = useState<'concurrent' | 'sequential'>('concurrent')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Esperando búsqueda.')
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [storeResults, setStoreResults] = useState<StoreResult[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const stores = ['gollo', 'monge', 'mexpress']

  const showStatus = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setStatusMessage(message)
    setStatusType(type)
  }

  const renderStoreCard = (store: string): StoreResult => {
    const existing = storeResults.find(r => r.store === store)
    return existing || { store, status: 'Aún no iniciado', products: [] }
  }

  const renderProduct = (product: Product, store: string) => {
    if (product.error) {
      return (
        <Alert key={`${store}-${product.error.code}`} className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error [Código {product.error.code}]: {product.error.message}
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Card key={`${store}-${product.name}`} className="mb-2">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img 
              src={product.image_url || 'https://via.placeholder.com/80'} 
              alt={product.name} 
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-2">{product.name}</h4>
              <div className="flex gap-2 mb-2">
                <span className="text-sm font-medium">{product.regular_price || 'N/A'}</span>
                {product.promo_price && product.promo_price !== 'Sin precio promocional' && (
                  <span className="text-sm text-red-600 font-medium">{product.promo_price}</span>
                )}
              </div>
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ver en {product.store}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const fetchStore = async (query: string, store: string): Promise<Product[]> => {
    console.log(`🔍 Buscando en ${store}: "${query}"`)
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&store=${store}`)
    console.log(`📡 Respuesta de ${store}: ${response.status}`)
    if (!response.ok) {
      throw new Error(`Error en la petición a ${store}`)
    }
    const data: SearchResponse = await response.json()
    const products = Array.isArray(data.results) ? data.results : (data.results?.[store] || [])
    console.log(`📦 Productos encontrados en ${store}: ${products.length}`)
    return products
  }

  const runSearch = async () => {
    const query = searchQuery.trim()
    if (!query) {
      showStatus('Ingrese un término de búsqueda', 'warning')
      return
    }

    console.log('🚀 Iniciando búsqueda:', query)
    setIsLoading(true)
    setStoreResults([])
    showStatus('Buscando...', 'info')

    const selectedStores = selectedStore === 'all' ? stores : [selectedStore]
    
    // Initialize store results
    const initialResults = selectedStores.map(store => ({
      store,
      status: 'Buscando...',
      products: []
    }))
    setStoreResults(initialResults)

    try {
      if (searchMode === 'concurrent') {
        showStatus('Buscando en todas las tiendas (concurrente)...', 'info')
        
        const promises = selectedStores.map(async (store) => {
          try {
            const products = await fetchStore(query, store)
            setStoreResults(prev => prev.map(r => 
              r.store === store 
                ? { ...r, status: `Encontrados ${products.length} items`, products }
                : r
            ))
            return { store, products }
          } catch (error) {
            console.error(`❌ Error en ${store}:`, error)
            setStoreResults(prev => prev.map(r => 
              r.store === store 
                ? { ...r, status: 'Error', products: [] }
                : r
            ))
            return { store, products: [] }
          }
        })
        
        await Promise.all(promises)
      } else {
        showStatus('Buscando secuencialmente...', 'info')
        
        for (const store of selectedStores) {
          setStoreResults(prev => prev.map(r => 
            r.store === store 
              ? { ...r, status: 'Buscando...' }
              : r
          ))
          
          try {
            const products = await fetchStore(query, store)
            setStoreResults(prev => prev.map(r => 
              r.store === store 
                ? { ...r, status: `Encontrados ${products.length} items`, products }
                : r
            ))
          } catch (error) {
            console.error(`❌ Error secuencial en ${store}:`, error)
            setStoreResults(prev => prev.map(r => 
              r.store === store 
                ? { ...r, status: 'Error', products: [] }
                : r
            ))
          }
        }
      }
      
      showStatus('✅ Búsqueda completada', 'success')
    } catch (error) {
      console.error('❌ Error general en búsqueda:', error)
      showStatus('Error en la búsqueda', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const exportResultsToExcel = () => {
    const allProducts: any[] = []
    
    storeResults.forEach(storeResult => {
      storeResult.products.forEach(product => {
        if (!product.error) {
          allProducts.push({
            'Tienda': storeResult.store.charAt(0).toUpperCase() + storeResult.store.slice(1),
            'Nombre del Producto': product.name,
            'Precio Regular': product.regular_price,
            'Precio Promoción': product.promo_price,
            'Enlace': product.url
          })
        }
      })
    })

    if (allProducts.length === 0) {
      showStatus('No hay resultados para exportar', 'warning')
      return
    }

    console.log('📊 Exportando', allProducts.length, 'productos a Excel')
    const ws = XLSX.utils.json_to_sheet(allProducts)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados de Búsqueda')
    XLSX.writeFile(wb, 'resultados_busqueda.xlsx')
    
    showStatus(`✅ Se exportaron ${allProducts.length} productos a Excel`, 'success')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv', '.tsv']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        showStatus('Formato no válido. Use Excel (.xlsx, .xls) o CSV (.csv, .tsv)', 'error')
        return
      }
      
      setUploadedFile(file)
      showStatus(`Archivo seleccionado: ${file.name}`, 'info')
    }
  }

  const processFile = async () => {
    if (!uploadedFile) {
      showStatus('Por favor, seleccione un archivo', 'warning')
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    showStatus('Procesando archivo, por favor espera...', 'info')

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      const result = await response.json()

      if (result.success) {
        setDownloadUrl(result.download_url)
        showStatus('✅ Proceso completado exitosamente', 'success')
      } else {
        showStatus(`❌ Error: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('❌ Error procesando archivo:', error)
      showStatus('Ocurrió un error de conexión. Inténtalo de nuevo', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const hasResults = storeResults.some(r => r.products.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-semibold">Buscador de Precios</span>
            </div>
            <Button variant="outline">Ayuda</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Comparador de Precios de Productos</h1>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Búsqueda Individual
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="font-semibold">BETA - </span>
              Comparación por Lote
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle>Búsqueda de Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Ej: Samsung S25 Ultra"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={runSearch} 
                    disabled={isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Seleccionar tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las tiendas</SelectItem>
                      <SelectItem value="gollo">Gollo</SelectItem>
                      <SelectItem value="monge">Monge</SelectItem>
                      <SelectItem value="mexpress">Mexpress</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchMode} onValueChange={(value: 'concurrent' | 'sequential') => setSearchMode(value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Modo de búsqueda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concurrent">Concurrente (rápido)</SelectItem>
                      <SelectItem value="sequential">Secuencial (1 por 1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Status Bar */}
            <Alert className={statusType === 'error' ? 'border-red-200 bg-red-50' : 
                             statusType === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                             statusType === 'success' ? 'border-green-200 bg-green-50' :
                             'border-blue-200 bg-blue-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>

            {/* Export Button */}
            {hasResults && (
              <div className="flex justify-end">
                <Button onClick={exportResultsToExcel} variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            )}

            {/* Store Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map(store => {
                const storeResult = renderStoreCard(store)
                return (
                  <Card key={store}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{store}</span>
                        <Badge variant={storeResult.status === 'Error' ? 'destructive' : 
                                       storeResult.status.includes('Encontrados') ? 'default' : 'secondary'}>
                          {storeResult.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {storeResult.products.map(product => renderProduct(product, store))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo para Comparación por Lote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    Sube un archivo Excel o CSV con las columnas <strong>'Descripción Artículo'</strong> y <strong>'Artículo'</strong>
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    <strong>ESTA PAGINA NO FUNCIONA CORRECTAMENTE, ESTA EN PERRIODO DE PRUEBA</strong>
                  </p>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv, .tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Seleccionar Archivo
                    </label>
                  </Button>
                </div>

                {uploadedFile && (
                  <div className="text-center">
                    <Button 
                      onClick={processFile} 
                      disabled={isProcessing}
                      className="min-w-[200px]"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <strong>BOTON DESACTIVADO - </strong>
                          Procesar y Comparar
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso del procesamiento</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {downloadUrl && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    <h2 className="text-2xl font-bold">¡Proceso Completado!</h2>
                    <p className="text-muted-foreground">Tu archivo de comparación de precios está listo para descargar.</p>
                    <Button asChild>
                      <a href={downloadUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Excel de Resultados
                      </a>
                    </Button>
                    <Button variant="outline" onClick={() => setDownloadUrl(null)}>
                      Procesar otro archivo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}