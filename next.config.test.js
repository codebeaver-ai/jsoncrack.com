const configExport = require('./next.config');
jest.mock('@sentry/nextjs', () => ({
  withSentryConfig: jest.fn(config => config),
}));
jest.mock('@next/bundle-analyzer', () => jest.fn(() => config => config));

describe('Next.js Configuration', () => {
  /**
   * Test the default configuration when ANALYZE is not "true" and GITHUB_REPOSITORY is not set
   */
  test('should return default configuration when ANALYZE is not "true" and GITHUB_REPOSITORY is not set', () => {
    // Arrange
    process.env.ANALYZE = 'false';
    process.env.GITHUB_REPOSITORY = 'some/other-repo';

    // Act
    const result = configExport;

    // Assert
    expect(result).toEqual(expect.objectContaining({
      output: 'export',
      reactStrictMode: false,
      productionBrowserSourceMaps: true,
      experimental: {
        optimizePackageImports: ['reaflow'],
      },
      compiler: {
        styledComponents: true,
      },
      webpack: expect.any(Function),
    }));

    // Check if webpack function is correctly defined
    const mockWebpackConfig = {};
    const mockContext = { isServer: false };
    const webpackResult = result.webpack(mockWebpackConfig, mockContext);

    expect(webpackResult.resolve.fallback).toEqual({ fs: false });
    expect(webpackResult.output.webassemblyModuleFilename).toBe('static/wasm/[modulehash].wasm');
    expect(webpackResult.experiments).toEqual({ asyncWebAssembly: true, layers: true });
    expect(webpackResult.output.environment).toEqual({ asyncFunction: true });
  });
});