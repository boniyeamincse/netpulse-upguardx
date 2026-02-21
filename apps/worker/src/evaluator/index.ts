import { ProbeResult } from '../prober/types'

export interface EvaluationResult {
    status: 'up' | 'down' | 'degraded'
    message?: string
}

export const evaluateResult = (monitor: any, probe: ProbeResult): EvaluationResult => {
    if (probe.status === 'down') {
        return {
            status: 'down',
            message: probe.message || 'Probe failed',
        }
    }

    if (probe.latency > 5000) {
        return {
            status: 'degraded',
            message: `High latency: ${probe.latency}ms`,
        }
    }

    return {
        status: 'up',
    }
}
