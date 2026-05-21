export async function priceFetch(url: string) {
    const match = url.match(/\/product\/(\d+)/)
    if (!match) return null

    const response = await fetch(
        `https://mpapi.tcgplayer.com/v2/product/${match[1]}/pricepoints`, {
            headers: {
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://www.tcgplayer.com',
        'Referer': 'https://www.tcgplayer.com/',
            },
            signal: AbortSignal.timeout(10000)
        }
    )
    const data = await response.json()
    const normal = data.find((p: any) => p.printingType === 'Normal')
    return normal?.marketPrice != null ? String(normal.marketPrice) : null
}