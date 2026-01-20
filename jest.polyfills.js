// Polyfills for Jest environment

// Mock fetch globally
global.fetch = require('jest-fetch-mock')

// Polyfill for TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for TransformStream
const { TransformStream } = require('web-streams-polyfill')
global.TransformStream = TransformStream

// Polyfill for ReadableStream
const { ReadableStream } = require('web-streams-polyfill')
global.ReadableStream = ReadableStream

// Polyfill for WritableStream
const { WritableStream } = require('web-streams-polyfill')
global.WritableStream = WritableStream

// Polyfill for BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
    this.onmessageerror = null
  }

  postMessage(message) {
    // Mock implementation - do nothing
  }

  close() {
    // Mock implementation - do nothing
  }

  addEventListener(type, listener) {
    // Mock implementation - do nothing
  }

  removeEventListener(type, listener) {
    // Mock implementation - do nothing
  }

  dispatchEvent(event) {
    // Mock implementation - do nothing
    return false
  }
}

// Polyfill for Response
global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || ''
    this.headers = new Headers(options.headers)
    this.ok = this.status >= 200 && this.status < 300
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }

  get bodyUsed() {
    return false
  }

  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...options.headers
      }
    })
  }
}

// Polyfill for Headers
global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = {}
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([name, value]) => {
          this.headers[name.toLowerCase()] = value
        })
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([name, value]) => {
          this.headers[name.toLowerCase()] = value
        })
      }
    }
  }

  get(name) {
    return this.headers[name.toLowerCase()] || null
  }

  set(name, value) {
    this.headers[name.toLowerCase()] = value
  }

  has(name) {
    return name.toLowerCase() in this.headers
  }

  delete(name) {
    delete this.headers[name.toLowerCase()]
  }

  forEach(callback) {
    Object.entries(this.headers).forEach(([name, value]) => {
      callback(value, name)
    })
  }

  entries() {
    return Object.entries(this.headers)[Symbol.iterator]()
  }

  keys() {
    return Object.keys(this.headers)[Symbol.iterator]()
  }

  values() {
    return Object.values(this.headers)[Symbol.iterator]()
  }

  [Symbol.iterator]() {
    return this.entries()
  }
}

// Polyfill for Request
global.Request = class Request {
  constructor(url, options = {}) {
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true,
      configurable: true
    })
    this.method = options.method || 'GET'
    this.headers = new Headers(options.headers)
    this.body = options.body
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }
}

// Polyfill for URL
global.URL = class URL {
  constructor(url) {
    this.href = url
    this.pathname = url.split('?')[0]
    this.search = url.includes('?') ? '?' + url.split('?')[1] : ''
  }

  get searchParams() {
    return new URLSearchParams(this.search.slice(1))
  }
}

// Polyfill for URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(search = '') {
    this.params = {}
    if (search) {
      search.replace(/^\?/, '').split('&').forEach(pair => {
        const [key, value] = pair.split('=')
        if (key) this.params[decodeURIComponent(key)] = decodeURIComponent(value || '')
      })
    }
  }

  get(key) {
    return this.params[key] || null
  }

  set(key, value) {
    this.params[key] = value
  }

  toString() {
    return Object.entries(this.params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  }
}

// Polyfill for NextRequest (extends Request)
global.NextRequest = class NextRequest extends Request {
  constructor(url, options = {}) {
    super(url, options)
    this.url = url
  }

  async json() {
    const text = await this.text()
    return JSON.parse(text)
  }
}

// Polyfill for NextResponse (extends Response)
global.NextResponse = class NextResponse extends Response {
  constructor(body, options = {}) {
    super(body, options)
  }

  static json(data, options = {}) {
    return new NextResponse(JSON.stringify(data), {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...options.headers
      }
    })
  }
}
