import got from 'got'
import { ProbeResult } from './types'
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent'

export interface HttpProbeOptions {
    headers?: Record<string, string>
    bodyMatch?: string
    followRedirect?: boolean
    timeout?: number
    proxy?: string
}

export const probeHttp = async (target: string, options: HttpProbeOptions = {}): Promise<ProbeResult> => {
    const start = Date.now()
    try {
        const gotOptions: any = {
            headers: options.headers,
            timeout: { request: options.timeout || 10000 },
            retry: { limit: 0 },
            followRedirect: options.followRedirect ?? true,
        }

        if (options.proxy) {
            const isHttps = target.startsWith('https')
            gotOptions.agent = {
                [isHttps ? 'https' : 'http']: isHttps
                    ? new HttpsProxyAgent({ proxy: options.proxy })
                    : new HttpProxyAgent({ proxy: options.proxy })
            }
        }

        const response = await got(target, gotOptions)

        const latency = Date.now() - start

        if (options.bodyMatch && !response.body.includes(options.bodyMatch)) {
            return {
                status: 'degraded',
                latency,
                statusCode: response.statusCode,
                message: `Body match failed: "${options.bodyMatch}" not found`,
            }
        }

        return {
            status: 'up',
            latency,
            statusCode: response.statusCode,
        }
    } catch (err: any) {
        const latency = Date.now() - start
        return {
            status: 'down',
            latency,
            statusCode: err.response?.statusCode,
            message: err.message,
        }
    }
}
