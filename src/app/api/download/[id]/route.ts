import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const processId = params.id

  try {
    // Generate simulated comparison data using AI
    const zai = await ZAI.create()
    
    const prompt = `Generate realistic product comparison data for a batch processing job. 
    Create 10-15 products with comparisons across Gollo, Monge, and MExpress stores in Costa Rica.
    
    For each product, include:
    - Product name
    - Gollo price (regular and promo)
    - Monge price (regular and promo) 
    - MExpress price (regular and promo)
    - Best price and store
    - URL to best price
    
    Return as JSON array with this structure:
    [
      {
        "Producto": "Samsung Galaxy S25 Ultra 256GB",
        "Gollo Regular": "₡1.250.000",
        "Gollo Promo": "₡1.150.000",
        "Monge Regular": "₡1.280.000",
        "Monge Promo": "₡1.200.000",
        "MExpress Regular": "₡1.240.000",
        "MExpress Promo": "₡1.180.000",
        "Mejor Precio": "₡1.150.000",
        "Tienda Mejor Precio": "Gollo",
        "URL": "https://www.gollo.com/samsung-s25-ultra"
      }
    ]`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates realistic product comparison data for Costa Rican stores. Always return valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse the AI response
    let comparisonData: any[]
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        comparisonData = JSON.parse(jsonMatch[0])
      } else {
        comparisonData = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      throw new Error('Invalid response format')
    }

    // Create Excel workbook
    const ws = XLSX.utils.json_to_sheet(comparisonData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Comparación de Precios')

    // Generate file buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return the file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="comparacion_precios_${processId}.xlsx"`,
      },
    })

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Error generating download file' },
      { status: 500 }
    )
  }
}