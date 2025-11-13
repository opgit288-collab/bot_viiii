import { NextRequest, NextResponse } from 'next/server'

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

interface SearchResponse {
  query: string
  results?: Record<string, Product[]>
  error?: string
}

// Generate mock product data
function generateMockProducts(store: string, query: string): Product[] {
  const queryLower = query.toLowerCase()
  const storeCapitalized = store.charAt(0).toUpperCase() + store.slice(1)

  // Base prices for different stores
  const priceMultipliers = {
    gollo: 1.0,
    monge: 1.05,
    mexpress: 0.95
  }

  const multiplier = priceMultipliers[store as keyof typeof priceMultipliers] || 1.0

  // Generate 3-5 products based on query
  const productCount = Math.floor(Math.random() * 3) + 3
  const products: Product[] = []

  for (let i = 0; i < productCount; i++) {
    const basePrice = Math.floor((Math.random() * 500000 + 100000) * multiplier)
    const hasPromo = Math.random() > 0.4
    const promoPrice = hasPromo ? Math.floor(basePrice * 0.85) : 0

    const productName = `${query} - Modelo ${String.fromCharCode(65 + i)} ${storeCapitalized}`

    products.push({
      name: productName,
      regular_price: `₡${basePrice.toLocaleString('es-CR')}`,
      promo_price: hasPromo ? `₡${promoPrice.toLocaleString('es-CR')}` : 'Sin precio promocional',
      url: `https://www.${store}.cr/productos/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-${i + 1}`,
      image_url: 'https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=' + encodeURIComponent(query.substring(0, 15)),
      store: storeCapitalized
    })
  }

  return products
}

// Simulated scraping function
async function scrapeStore(store: string, query: string): Promise<Product[]> {
  try {
    console.log(`[${store}] Iniciando búsqueda para: "${query}"`)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    // Generate mock products
    const products = generateMockProducts(store, query)

    console.log(`[${store}] Encontrados ${products.length} productos`)
    return products

  } catch (error) {
    console.error(`Error scraping ${store}:`, error)

    // Return error result
    return [{
      name: '',
      regular_price: '',
      promo_price: '',
      url: '',
      image_url: '',
      store: store.charAt(0).toUpperCase() + store.slice(1),
      error: {
        code: store === 'gollo' ? 100 : store === 'monge' ? 101 : 102,
        message: `Error al acceder al sitio de ${store.charAt(0).toUpperCase() + store.slice(1)}`
      }
    }]
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || searchParams.get('query')
  const store = (searchParams.get('store') || 'all').toLowerCase()

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter `q\'' },
      { status: 400 }
    )
  }

  try {
    if (store === 'all') {
      // Search all stores concurrently
      const stores = ['gollo', 'monge', 'mexpress']
      
      const promises = stores.map(async (storeName) => {
        try {
          const results = await scrapeStore(storeName, query)
          return { store: storeName, results }
        } catch (error) {
          console.error(`Error in ${storeName}:`, error)
          return { 
            store: storeName, 
            results: [{
              name: '',
              regular_price: '',
              promo_price: '',
              url: '',
              image_url: '',
              store: storeName.charAt(0).toUpperCase() + storeName.slice(1),
              error: {
                code: storeName === 'gollo' ? 100 : storeName === 'monge' ? 101 : 102,
                message: `Error en ${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`
              }
            }]
          }
        }
      })

      const storeResults = await Promise.all(promises)
      
      const results: Record<string, Product[]> = {}
      storeResults.forEach(({ store, results: storeProducts }) => {
        results[store] = storeProducts
      })

      return NextResponse.json({
        query,
        results
      })

    } else {
      // Search specific store
      if (!['gollo', 'monge', 'mexpress'].includes(store)) {
        return NextResponse.json(
          { error: `Unknown store '${store}'` },
          { status: 400 }
        )
      }

      try {
        const results = await scrapeStore(store, query)
        return NextResponse.json({
          query,
          store,
          results
        })
      } catch (error) {
        console.error(`Error in ${store}:`, error)
        return NextResponse.json({
          query,
          store,
          results: [{
            name: '',
            regular_price: '',
            promo_price: '',
            url: '',
            image_url: '',
            store: store.charAt(0).toUpperCase() + store.slice(1),
            error: {
              code: store === 'gollo' ? 100 : store === 'monge' ? 101 : 102,
              message: `Error en ${store.charAt(0).toUpperCase() + store.slice(1)}`
            }
          }]
        })
      }
    }

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}