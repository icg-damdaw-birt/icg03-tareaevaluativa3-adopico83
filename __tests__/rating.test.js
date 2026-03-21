const request = require('supertest');

// 1. Mock de Prisma
jest.mock('../lib/prisma', () => ({
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
}));

// 2. Mock del middleware de autenticación
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const mockPrisma = require('../lib/prisma');

describe('API de Rating', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería actualizar el rating de una película (camino feliz)', async () => {
    mockPrisma.movie.findFirst.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-123',
      rating: 0,
    });
    mockPrisma.movie.update.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-123',
      rating: 4,
    });

    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .send({ rating: 4 });

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(4);
  });

  it('debería devolver 400 si el rating es mayor que 5', async () => {
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .send({ rating: 6 });

    expect(response.status).toBe(400);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
  });

  it('debería devolver 400 si el rating es negativo', async () => {
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .send({ rating: -1 });

    expect(response.status).toBe(400);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
  });

  it('debería devolver 400 si no se envía rating en el body', async () => {
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .send({});

    expect(response.status).toBe(400);
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
  });
});