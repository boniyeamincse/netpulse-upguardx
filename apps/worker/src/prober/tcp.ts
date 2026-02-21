import net from 'net'
import { ProbeResult } from './types'

export const probeTcp = async (host: string, port: number, timeout: number = 10000): Promise<ProbeResult> => {
    const start = Date.now()
    return new Promise((resolve) => {
        const socket = new net.Socket()

        socket.setTimeout(timeout)

        socket.on('connect', () => {
            const latency = Date.now() - start
            socket.destroy()
            resolve({ status: 'up', latency })
        })

        socket.on('timeout', () => {
            socket.destroy()
            resolve({
                status: 'down',
                latency: Date.now() - start,
                message: 'Connection timeout',
            })
        })

        socket.on('error', (err) => {
            socket.destroy()
            resolve({
                status: 'down',
                latency: Date.now() - start,
                message: err.message,
            })
        })

        socket.connect(port, host)
    })
}
