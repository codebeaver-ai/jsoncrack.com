const path = require('path');
jest.mock('@sentry/nextjs', () => ({
  withSentryConfig: jest.fn(config => config),
}));
jest.mock('@next/bundle-analyzer', () => jest.fn(() => config => config));

const { withSentryConfig } = require("@sentry/nextjs");

const withBundleAnalyzer = require('@next/bundle-analyzer');

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

  /**
   * Test the configuration when ANALYZE is set to "true"
   */
  test('should return configuration with bundle analyzer when ANALYZE is "true"', () => {
    // Arrange
    process.env.ANALYZE = 'true';
    process.env.GITHUB_REPOSITORY = 'some/other-repo';
    const mockWithBundleAnalyzer = jest.fn(config => ({ ...config, bundleAnalyzer: true }));
    withBundleAnalyzer.mockImplementation(() => mockWithBundleAnalyzer);

    // Act
    const result = configExport;

    // Assert
    expect(mockWithBundleAnalyzer).toHaveBeenCalledWith(expect.objectContaining({
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
    expect(result).toEqual(expect.objectContaining({
      bundleAnalyzer: true,
    }));

    // Clean up
    process.env.ANALYZE = 'false';
  });

  /**
   * Test the configuration when GITHUB_REPOSITORY is set to "AykutSarac/jsoncrack.com"
   * This test checks if the Sentry configuration is applied correctly
   */
  test('should return configuration with Sentry when GITHUB_REPOSITORY is "AykutSarac/jsoncrack.com"', () => {
    // Arrange
    process.env.ANALYZE = 'false';
    process.env.GITHUB_REPOSITORY = 'AykutSarac/jsoncrack.com';
    const mockWithSentryConfig = jest.fn((config, sentryWebpackPluginOptions, sentryOptions) => ({
      ...config,
      sentry: true,
      sentryWebpackPluginOptions,
      sentryOptions
    }));
    withSentryConfig.mockImplementation(mockWithSentryConfig);

    // Act
    const result = configExport;

    // Assert
    expect(mockWithSentryConfig).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
      {
        silent: true,
        org: "aykut-sarac",
        project: "json-crack",
      },
      {
        widenClientFileUpload: true,
        hideSourceMaps: true,
        disableLogger: true,
        disableServerWebpackPlugin: true,
      }
    );
    expect(result).toEqual(expect.objectContaining({
      sentry: true,
      sentryWebpackPluginOptions: {
        silent: true,
        org: "aykut-sarac",
        project: "json-crack",
      },
      sentryOptions: {
        widenClientFileUpload: true,
        hideSourceMaps: true,
        disableLogger: true,
        disableServerWebpackPlugin: true,
      }
    }));

    // Clean up
    process.env.GITHUB_REPOSITORY = 'some/other-repo';
  });

describe('Next.js Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  /**
   * Test the webpack configuration when isServer is true
   * This test checks if the asyncFunction environment setting is not added for server-side builds
   */
  test('should not add asyncFunction to environment for server-side builds', () => {
    jest.isolateModules(() => {
      // Arrange
      process.env.ANALYZE = 'false';
      process.env.GITHUB_REPOSITORY = 'some/other-repo';
      const nextConfig = require('../next.config');
      const config = nextConfig();
      const mockWebpackConfig = {};
      const mockContext = { isServer: true };

      // Act
      const webpackResult = config.webpack(mockWebpackConfig, mockContext);

      // Assert
      expect(webpackResult.resolve.fallback).toEqual({ fs: false });
      expect(webpackResult.output.webassemblyModuleFilename).toBe('static/wasm/[modulehash].wasm');
      expect(webpackResult.experiments).toEqual({ asyncWebAssembly: true, layers: true });
      expect(webpackResult.output.environment).toBeUndefined();
    });
  });
});