const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
const { MessagePort, MessageChannel, MessageEvent } = require('worker_threads');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream;
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream;
}
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream;
}
if (typeof global.MessagePort === 'undefined') {
  global.MessagePort = MessagePort;
}
if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = MessageChannel;
}
if (typeof global.MessageEvent === 'undefined') {
  global.MessageEvent = MessageEvent;
}

const undici = require('undici');
const { Request: UndiciRequest, Response: UndiciResponse, Headers: UndiciHeaders, fetch: undiciFetch } = undici;

if (typeof global.Request === 'undefined') {
  global.Request = UndiciRequest;
}
if (typeof global.Response === 'undefined') {
  global.Response = UndiciResponse;
}
if (typeof global.Headers === 'undefined') {
  global.Headers = UndiciHeaders;
}
if (typeof global.fetch === 'undefined') {
  global.fetch = undiciFetch;
}

const { GET, POST } = require('@/app/api/clients/route');
const { NextRequest } = require('next/server');

// Mock MongoDB connection
jest.mock('@/lib/mongo', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/clientModel', () => ({
  ClientSchema: {},
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  models: {},
  model: jest.fn(() => ({
    countDocuments: jest.fn().mockResolvedValue(10),
    find: jest.fn(() => {
      const queryBuilder: any = {
        skip: jest.fn(() => queryBuilder),
        limit: jest.fn(() => queryBuilder),
        lean: jest.fn().mockResolvedValue([]),
        select: jest.fn(() => queryBuilder),
      };
      return queryBuilder;
    }),
    create: jest.fn().mockResolvedValue({ _id: '1' }),
  })),
}));

describe('API /api/clients', () => {
  describe('GET', () => {
    it('should return clients with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/clients?page=1&limit=10&section=clients');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 10,
        totalPages: 1,
      });
    });

    it('should use default limit when not specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/clients?page=1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(50);
    });

    it('should filter by section when specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/clients?section=dp-en-cours');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should create a new client', async () => {
      const mockClient = {
        client: 'Test Client',
        section: 'clients',
        statut: 'en cours',
      };

      const request = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClient),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('_id');
    });

    it('should return 400 for invalid section', async () => {
      const mockClient = {
        client: 'Test Client',
        section: 'invalid-section',
        statut: 'en cours',
      };

      const request = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClient),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for missing section', async () => {
      const mockClient = {
        client: 'Test Client',
        statut: 'en cours',
      };

      const request = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClient),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
});
