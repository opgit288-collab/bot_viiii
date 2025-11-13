import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

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

// Simulated scraping function using AI to generate realistic product data
async function scrapeStore(store: string, query: string): Promise<Product[]> {
  try {
    const zai = await ZAI.create()
    
    const prompt = `Generate 3-5 realistic product search results for "${query}" from ${store} store in Costa Rica. 
    For each product, provide:
    - name: Complete product name
    - regular_price: Price in Costa Rican colones (format: ₡X.XXX.XXX)
    - promo_price: Promotional price or "Sin precio promocional"
    - url: Realistic product URL
    - image_url: Placeholder image URL
    
    Return as JSON array with the exact structure. Make prices realistic for Costa Rica market.
    
    Example format:
    [
      {
        "name": "Samsung Galaxy S25 Ultra 256GB Negro",
        "regular_price": "₡1.250.000",
        "promo_price": "₡1.150.000",
        "url": "https://www.${store}.com/samsung-s25-ultra",
        "image_url": "https://via.placeholder.com/300x300"
      }
    ]`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates realistic product search results for Costa Rican stores. Always return valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse the AI response
    let products: any[]
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0])
      } else {
        products = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      throw new Error('Invalid response format')
    }

    // Validate and format products
    return products.map((product: any) => ({
      name: product.name || 'Producto desconocido',
      regular_price: product.regular_price || '₡0',
      promo_price: product.promo_price || 'Sin precio promocional',
      url: product.url || `https://www.${store}.com/product`,
      image_url: product.image_url || 'https://via.placeholder.com/300x300',
      store: store.charAt(0).toUpperCase() + store.slice(1),
      error: undefined
    }))

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