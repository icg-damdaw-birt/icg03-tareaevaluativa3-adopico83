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

describe('PATCH /api/movies/:id/favorite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería cambiar el estado de favorito (camino feliz)', async () => {
    // Configurar comportamiento para que devuelva la película
    mockPrisma.movie.findFirst.mockResolvedValue({ 
      id: 'movie-1', 
      ownerId: 'user-123', 
      isFavorite: false 
    });
    // Y la devuelva como marcada favorita
    mockPrisma.movie.update.mockResolvedValue({ 
      id: 'movie-1', 
      ownerId: 'user-123', 
      isFavorite: true 
    });

    const response = await request(app).patch('/api/movies/movie-1/favorite');

    expect(response.status).toBe(200);
    expect(response.body.isFavorite).toBe(true);
    expect(mockPrisma.movie.update).toHaveBeenCalledWith({
      where: { id: 'movie-1' },
      data: { isFavorite: true },
    });
  });

  it('debería devolver error 404 si la película no existe o no es del usuario', async () => {
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const response = await request(app).patch('/api/movies/movie-999/favorite');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Película no encontrada');
    expect(mockPrisma.movie.update).not.toHaveBeenCalled();
  });

  it('debería devolver error 500 si hay un problema con prisma', async () => {
    mockPrisma.movie.findFirst.mockRejectedValue(new Error('DB Error'));

    const response = await request(app).patch('/api/movies/movie-1/favorite');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Error del servidor al actualizar favoritos');
  });
});
