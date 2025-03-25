export async function verifyRecords(domain) {
  let score = 0

  // Helper function to check domain status and MX records using networkcalc API
  async function fetchFromNetworkCalc(domain) {
    try {
      const response = await fetch(
        `https://networkcalc.com/api/dns/lookup/${domain}`
      )
      if (!response.ok) throw new Error('Failed to fetch from NetworkCalc')
      const data = await response.json()

      // Extract domain status
      const domainStatus = data.records?.NS?.length ? 'active' : 'inactive'
      const isParked = data.records?.NS?.some((ns) =>
        [
          'parked.com',
          'sedoparking.com',
          'bodis.com',
          'parkingcrew.net',
          'parklogic.com',
          'namejet.com',
        ].some((parking) => ns.nameserver.includes(parking))
      )
      const status = isParked ? 'parked' : domainStatus

      // Extract MX records
      const mxRecord =
        data.records?.MX?.length > 0 ? data.records.MX[0].exchange : null

      return { domain_status: status, mx_record: mxRecord }
    } catch (error) {
      console.error('Error fetching from NetworkCalc:', error)
      throw error // Let it fall back to the next method
    }
  }

  // Helper function to fetch records from Google DNS API
  async function fetchFromGoogleDNS(domain) {
    console.log('Fetching from Google DNS...')
    try {
      const [aResponse, mxResponse] = await Promise.all([
        fetch(`https://dns.google/resolve?name=${domain}&type=A`).then((res) =>
          res.json()
        ),
        fetch(`https://dns.google/resolve?name=${domain}&type=MX`).then((res) =>
          res.json()
        ),
      ])

      const domainStatus = aResponse.Answer?.length ? 'active' : 'inactive'
      const mxRecord =
        mxResponse.Answer?.find((answer) => answer.type === 15)?.data.split(
          ' '
        )[1] || null

      return { domain_status: domainStatus, mx_record: mxRecord }
    } catch (error) {
      console.error('Error fetching from Google DNS:', error)
      throw error // Let it fall back to the next method
    }
  }

  // Helper function to fetch records from RapidAPI DNS API
  async function fetchFromRapidAPI(domain) {
    console.log('Fetching from RapidAPI...')
    try {
      const response = await fetch(
        `https://domains-api.p.rapidapi.com/domains/${domain}/dns-records`,
        {
          headers: {
            'x-rapidapi-key':
              '16694e7bd9mshc142c1c106b892fp13d30ajsnb9f0e901c7d7',
            'x-rapidapi-host': 'domains-api.p.rapidapi.com',
          },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch from RapidAPI')
      const data = await response.json()

      // Extract A records to determine domain status
      const aRecords = data.filter((record) => record.type === 'A')
      const domainStatus = aRecords.length > 0 ? 'active' : 'inactive'

      // Extract MX records and sort by priority
      const mxRecords = data
        .filter((record) => record.type === 'MX')
        .map((record) => {
          const [priority, ...exchangeParts] = record.data.split(' ')
          return {
            priority: parseInt(priority, 10),
            exchange: exchangeParts.join(' '),
          }
        })
        .sort((a, b) => a.priority - b.priority)

      // Get the highest priority MX record
      const mxRecord = mxRecords.length > 0 ? mxRecords[0].exchange : null

      return { domain_status: domainStatus, mx_record: mxRecord }
    } catch (error) {
      console.error('Error fetching from RapidAPI:', error)
      return { domain_status: 'unknown', mx_record: null }
    }
  }

  // Main logic
  let result
  try {
    result = await fetchFromNetworkCalc(domain)
  } catch {
    try {
      result = await fetchFromGoogleDNS(domain)
    } catch {
      result = await fetchFromRapidAPI(domain)
    }
  }

  // Update scores based on results
  const { domain_status, mx_record } = result
  if (domain_status === 'active') {
    score += 20
  } else if (domain_status === 'parked' || domain_status === 'inactive') {
    score -= 20
  }

  if (mx_record) {
    score += 30
  } else {
    score -= 30
  }

  return { score, domain_status, mx_record }
}
