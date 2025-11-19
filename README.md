# realtm

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI](https://github.com/julienandreu/realtm/workflows/CI/badge.svg)](https://github.com/julienandreu/realtm/actions)
[![Coverage](https://img.shields.io/codecov/c/github/julienandreu/realtm)](https://codecov.io/gh/julienandreu/realtm)

A real-time communication library built with Socket.IO and Redis Streams, enabling scalable event-driven messaging between servers and clients.

## 🚀 Features

- **Real-time Communication**: WebSocket-based bidirectional communication using Socket.IO
- **Redis Streams Integration**: Event-driven architecture with Redis Streams for reliable message processing
- **Room-based Messaging**: Tag-based room system for organizing and routing messages to specific clients
- **Auto-reconnection**: Built-in client reconnection with configurable delays
- **Type-safe**: Full TypeScript support with Zod schema validation
- **Scalable Architecture**: Clean architecture with dependency injection using tsyringe
- **Consumer Group Support**: Redis consumer groups for distributed message processing
- **Message Acknowledgment**: Reliable message delivery with acknowledgment and cleanup

## 📦 Installation

```bash
npm install realtm
```

## 📖 Examples

### Server Setup

```bash
# Set environment variables
export PORT=3000
export REDIS_URL=redis://localhost:6379

# Start the server
npm run dev server
```

### Client Setup

```bash
# Set environment variables
export URL=http://localhost:3000
export RECONNECTION_DELAY=1000
export CONNECTION_TIMEOUT=5000

# Start a client with tags
npm run dev client tag1 tag2
```

### Programmatic Usage

```typescript
import {startServer} from 'realtm';
import {startClient} from 'realtm';

// Start server
startServer();

// Start client with tags
const socket = startClient({tags: ['worker', 'backend']});
```

## 📚 Documentation

- **[README.md](README.md)** - Project overview and quick start guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guidelines for contributing to the project
- **[SECURITY.md](SECURITY.md)** - Security policy and vulnerability reporting

## 🛠️ Development

### Prerequisites

- Node.js ≥ 24.11.1
- npm or yarn
- Redis server (for stream processing)

### Setup

```bash
# Clone the repository
git clone https://github.com/julienandreu/realtm.git
cd realtm

# Install dependencies
npm install

# Start Redis (using Docker)
npm run redis:start

# Or use your own Redis instance
# Make sure Redis is running and accessible

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Available Scripts

| Script                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run build`         | Build the project                                                 |
| `npm run dev`           | Run development server/client (use `server` or `client` argument) |
| `npm test`              | Run tests                                                         |
| `npm run test:watch`    | Run tests in watch mode                                           |
| `npm run test:coverage` | Run tests with coverage                                           |
| `npm run test:ui`       | Run tests with UI                                                 |
| `npm run lint`          | Lint and fix code                                                 |
| `npm run format`        | Format code with Prettier                                         |
| `npm run type-check`    | Type check without emitting                                       |
| `npm run validate`      | Run all checks (lint, format, type-check, test)                   |
| `npm run clean`         | Clean build artifacts                                             |
| `npm run redis:start`   | Start Redis server using Docker                                   |

## 📋 Requirements

- **Node.js**: ≥ 24.11.1
- **Redis**: Redis server for stream processing
- **TypeScript**: ≥ 5.9.3
- **Zod**: ≥ 4.1.12

## 🔧 Configuration

### Server Environment Variables

- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection URL (required)
- `CERT_PATH` - Path to SSL certificate (optional, for HTTPS)
- `KEY_PATH` - Path to SSL private key (optional, for HTTPS)
- `ENCRYPTION_KEY` - Encryption key for secure communication (optional)

### Client Environment Variables

- `URL` - Server URL to connect to (required)
- `RECONNECTION_DELAY` - Delay between reconnection attempts in ms (default: 1000)
- `CONNECTION_TIMEOUT` - Connection timeout in ms (default: 5000)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run validation: `npm run validate`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) - Real-time bidirectional event-based communication
- [Redis](https://redis.io/) - In-memory data structure store and streams
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [tsyringe](https://github.com/microsoft/tsyringe) - Dependency injection container

## 📞 Support

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/julienandreu/realtm/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/julienandreu/realtm/discussions)
- 📧 **Email**: [julienandreu@me.com](mailto:julienandreu@me.com)

---

Made with ❤️ by [Julien Andreu](https://github.com/julienandreu)
