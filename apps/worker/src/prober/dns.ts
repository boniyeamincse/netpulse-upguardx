import dns from 'dns/promises'
import { ProbeResult } from './types'

export const probeDns = async (hostname: string, recordType: string = 'A'): Promise<ProbeResult> => {
    const start = Date.now()
    try {
        let records: string[] = []

        switch (recordType.toUpperCase()) {
            case 'AAAA': {
                records = await dns.resolve6(hostname)
                break
            }
            case 'MX': {
                const mx = await dns.resolveMx(hostname)
                records = mx.map(r => `${r.exchange} (${r.priority})`)
                break
            }
            case 'CNAME': {
                records = await dns.resolveCname(hostname)
                break
            }
            default: {
                records = await dns.resolve4(hostname)
            }
        }

        const latency = Date.now() - start
        return {
            status: 'up',
            latency,
            records,
        }
    } catch (err: any) {
        const latency = Date.now() - start
        return {
            status: 'down',
            latency,
            message: err.message,
        }
    }
}
