import { jest, describe, it, expect } from '@jest/globals'
import net from 'net'
import { probeTcp } from '../tcp'

jest.mock('net', () => ({
    Socket: jest.fn()
}))

describe('TcpProber', () => {
    it('should return up when connection is successful', async () => {
        const mockSocket: any = {
            connect: jest.fn().mockReturnThis(),
            on: jest.fn(function (this: any, event: string, cb: any) {
                if (event === 'connect') setTimeout(cb, 10)
                return this
            }),
            setTimeout: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
        }

        // @ts-ignore
        net.Socket.mockImplementation(() => mockSocket)

        const result = await probeTcp('localhost', 80)

        expect(result.status).toBe('up')
        expect(result.latency).toBeGreaterThanOrEqual(0)
    })

    it('should return down when connection fails', async () => {
        const mockSocket: any = {
            connect: jest.fn().mockReturnThis(),
            on: jest.fn(function (this: any, event: string, cb: any) {
                if (event === 'error') setTimeout(() => cb(new Error('Connection refused')), 10)
                return this
            }),
            setTimeout: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
        }

        // @ts-ignore
        net.Socket.mockImplementation(() => mockSocket)

        const result = await probeTcp('localhost', 80)

        expect(result.status).toBe('down')
        expect(result.message).toBe('Connection refused')
    })
})
