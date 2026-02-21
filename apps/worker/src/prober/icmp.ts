import { ProbeResult } from './types'
import { spawn } from 'child_process'

const TARGET_PATTERN = /^[a-zA-Z0-9.-]+$/

export const probeIcmp = async (target: string): Promise<ProbeResult> => {
    const start = Date.now()
    if (!TARGET_PATTERN.test(target)) {
        return {
            status: 'down',
            latency: 0,
            message: 'Invalid ICMP target',
        }
    }

    try {
        const latency = await new Promise<number>((resolve, reject) => {
            const ping = spawn('ping', ['-c', '1', '-W', '5', target], { stdio: ['ignore', 'pipe', 'pipe'] })
            let stdout = ''
            let stderr = ''

            ping.stdout.on('data', (chunk) => {
                stdout += chunk.toString()
            })
            ping.stderr.on('data', (chunk) => {
                stderr += chunk.toString()
            })

            ping.on('error', (err) => reject(err))
            ping.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(stderr || `ping exited with code ${code}`))
                    return
                }
                const match = stdout.match(/time=([0-9.]+) ms/)
                resolve(match ? parseFloat(match[1]) : Date.now() - start)
            })
        })

        return {
            status: 'up',
            latency,
        }
    } catch (err: any) {
        return {
            status: 'down',
            latency: Date.now() - start,
            message: err.message,
        }
    }
}
