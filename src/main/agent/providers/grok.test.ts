import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGrokProvider } from './grok'
import type { ProviderEvent } from './types'

function sseStream(frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let index = 0
  return new ReadableStream({
    pull(controller) {
      if (index < frames.length) {
        controller.enqueue(encoder.encode(frames[index]))
        index += 1
      } else {
        controller.close()
      }
    }
  })
}

async function collect(iterable: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const events: ProviderEvent[] = []
  for await (const event of iterable) events.push(event)
  return events
}

describe('createGrokProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('yields text_delta events in order followed by a done event with the full content', async () => {
    const body = sseStream([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      'data: [DONE]\n\n'
    ])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))

    const provider = createGrokProvider('sk-test')
    const events = await collect(provider.chat([{ role: 'user', content: 'hi' }], []))

    expect(events).toEqual([
      { type: 'text_delta', delta: 'Hel' },
      { type: 'text_delta', delta: 'lo' },
      { type: 'done', message: { role: 'assistant', content: 'Hello' } }
    ])
  })

  it('sends stream:true, the model, and the messages in the request body with an auth header', async () => {
    const fetchMock = vi.fn(
      async () => new Response(sseStream(['data: [DONE]\n\n']), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = createGrokProvider('sk-test')
    await collect(provider.chat([{ role: 'user', content: 'hi' }], []))

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.x.ai/v1/chat/completions')
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      model: 'grok-4-fast',
      stream: true,
      messages: [{ role: 'user', content: 'hi' }]
    })
    expect(init.headers).toMatchObject({ Authorization: 'Bearer sk-test' })
  })

  it('maps a 401 response to an AUTH error before reading the stream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })))

    const provider = createGrokProvider('sk-bad')
    await expect(collect(provider.chat([], []))).rejects.toMatchObject({ code: 'AUTH' })
  })

  it('maps a 403 response to an AUTH error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 403 })))

    const provider = createGrokProvider('sk-bad')
    await expect(collect(provider.chat([], []))).rejects.toMatchObject({ code: 'AUTH' })
  })

  it('maps a 429 response to a RATE_LIMIT error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 429 })))

    const provider = createGrokProvider('sk-test')
    await expect(collect(provider.chat([], []))).rejects.toMatchObject({ code: 'RATE_LIMIT' })
  })

  it('maps another non-2xx response to a PROVIDER_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })))

    const provider = createGrokProvider('sk-test')
    await expect(collect(provider.chat([], []))).rejects.toMatchObject({ code: 'PROVIDER_ERROR' })
  })

  it('maps a fetch rejection to a NETWORK error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )

    const provider = createGrokProvider('sk-test')
    await expect(collect(provider.chat([], []))).rejects.toMatchObject({ code: 'NETWORK' })
  })

  it('maps a dropped connection mid-stream to NETWORK, keeping tokens already yielded', async () => {
    const encoder = new TextEncoder()
    let pullCount = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pullCount += 1
        if (pullCount === 1) {
          controller.enqueue(
            encoder.encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n')
          )
          return
        }
        controller.error(new Error('connection reset'))
      }
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))

    const provider = createGrokProvider('sk-test')
    const events: ProviderEvent[] = []
    await expect(
      (async () => {
        for await (const event of provider.chat([], [])) events.push(event)
      })()
    ).rejects.toMatchObject({ code: 'NETWORK' })
    expect(events).toEqual([{ type: 'text_delta', delta: 'Hel' }])
  })

  it('maps a malformed SSE frame to a PROVIDER_ERROR', async () => {
    const body = sseStream(['data: not-json\n\n'])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))

    const provider = createGrokProvider('sk-test')
    await expect(collect(provider.chat([], []))).rejects.toMatchObject({ code: 'PROVIDER_ERROR' })
  })

  it('rejects with NETWORK when the caller signal is aborted', async () => {
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          )
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()
    const provider = createGrokProvider('sk-test')
    const iterator = provider.chat([], [], controller.signal)[Symbol.asyncIterator]()
    const pending = iterator.next()
    controller.abort()

    await expect(pending).rejects.toMatchObject({ code: 'NETWORK' })
  })
})
