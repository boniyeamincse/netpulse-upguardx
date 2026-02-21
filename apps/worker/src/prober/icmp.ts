import { exec } from 'child_process'
import { promisify } from 'util'
import { ProbeResult } from './types'

const execAsync = promisify(exec)

export const probeIcmp = async (target: string): Promise<ProbeResult> => {
    const start = Date.now()
    try {
        const { stdout } = await execAsync(`ping -c 1 -W 5 ${target}`)
        const match = stdout.match(/time=([0-9.]+) ms/)
        const latency = match ? parseFloat(match[1]) : (Date.now() - start)

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
