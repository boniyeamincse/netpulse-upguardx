import { jest, describe, it, expect, afterEach } from '@jest/globals'
import nock from 'nock'
import { probeHttp } from '../http'

describe('HttpProber', () => {
    afterEach(() => {
        nock.cleanAll()
    })

    it('should return up when request is successful', async () => {
        nock('http://example.com').get('/').reply(200, 'OK')

        const result = await probeHttp('http://example.com')

        expect(result.status).toBe('up')
        expect(result.statusCode).toBe(200)
        expect(result.latency).toBeGreaterThanOrEqual(0)
    })

    it('should handle custom headers', async () => {
        nock('http://example.com', {
            reqheaders: { 'X-Custom': 'Value' }
        }).get('/').reply(200, 'OK')

        const result = await probeHttp('http://example.com', {
            headers: { 'X-Custom': 'Value' }
        })

        expect(result.status).toBe('up')
    })

    it('should return degraded if body match fails', async () => {
        nock('http://example.com').get('/').reply(200, 'Wrong Body')

        const result = await probeHttp('http://example.com', { bodyMatch: 'Right Body' })

        expect(result.status).toBe('degraded')
        expect(result.message).toContain('Body match failed')
    })

    it('should return down if request fails', async () => {
        nock('http://example.com').get('/').replyWithError('Network error')

        const result = await probeHttp('http://example.com')

        expect(result.status).toBe('down')
        expect(result.message).toBe('Network error')
    })
})
