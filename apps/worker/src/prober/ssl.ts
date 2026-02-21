import tls from 'tls'
import { ProbeResult } from './types'

export const probeSsl = async (host: string, port: number = 443, timeout: number = 10000): Promise<ProbeResult> => {
    const start = Date.now()
    return new Promise((resolve) => {
        const socket = tls.connect(port, host, { servername: host, rejectUnauthorized: false }, () => {
            const cert: any = socket.getPeerCertificate()
            const latency = Date.now() - start

            if (!cert || !cert.valid_to) {
                socket.destroy()
                resolve({ status: 'down', latency, message: 'Invalid certificate' })
                return
            }

            const validTo = new Date(cert.valid_to)
            const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

            socket.destroy()
            resolve({
                status: daysRemaining > 0 ? 'up' : 'down',
                latency,
                daysRemaining,
                validTo: cert.valid_to,
            })
        })

        socket.setTimeout(timeout)

        socket.on('timeout', () => {
            socket.destroy()
            resolve({ status: 'down', latency: Date.now() - start, message: 'SSL connection timeout' })
        })

        socket.on('error', (err) => {
            socket.destroy()
            resolve({ status: 'down', latency: Date.now() - start, message: err.message })
        })
    })
}
