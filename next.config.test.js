const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require('@next/bundle-analyzer');

jest.mock('@sentry/nextjs', () => ({
  withSentryConfig: jest.fn(config => config),
}));
jest.mock('@next/bundle-analyzer', () => jest.fn(() => config => config));

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});
afterAll(() => {
  process.env = originalEnv;
});

const configExport = require('./next.config');

describe('Next.js Configuration', () => {
  test('should return default configuration when ANALYZE is not "true" and GITHUB_REPOSITORY is not set', () => {
    process.env.ANALYZE = 'false';
    process.env.GITHUB_REPOSITORY = 'some/other-repo';

    const result = configExport;

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

    const mockWebpackConfig = {};
    const mockContext = { isServer: false };
    const webpackResult = result.webpack(mockWebpackConfig, mockContext);

    expect(webpackResult.resolve.fallback).toEqual({ fs: false });
    expect(webpackResult.output.webassemblyModuleFilename).toBe('static/wasm/[modulehash].wasm');
    expect(webpackResult.experiments).toEqual({ asyncWebAssembly: true, layers: true });
    expect(webpackResult.output.environment).toEqual({ asyncFunction: true });
  });

  test('should return configuration with bundle analyzer when ANALYZE is "true"', () => {
    process.env.ANALYZE = 'true';
    process.env.GITHUB_REPOSITORY = 'some/other-repo';
    const mockWithBundleAnalyzer = jest.fn(config => ({ ...config, bundleAnalyzer: true }));
    withBundleAnalyzer.mockImplementation(() => mockWithBundleAnalyzer);

    const result = configExport;

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

    process.env.ANALYZE = 'false';
  });

  test('should return configuration with Sentry when GITHUB_REPOSITORY is "AykutSarac/jsoncrack.com"', () => {
    process.env.ANALYZE = 'false';
    process.env.GITHUB_REPOSITORY = 'AykutSarac/jsoncrack.com';
    const mockWithSentryConfig = jest.fn((config, sentryWebpackPluginOptions, sentryOptions) => ({
      ...config,
      sentry: true,
      sentryWebpackPluginOptions,
      sentryOptions
    }));
    withSentryConfig.mockImplementation(mockWithSentryConfig);

    const result = configExport;

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

    process.env.GITHUB_REPOSITORY = 'some/other-repo';
  });

  test('should not add asyncFunction to environment for server-side builds', () => {
    process.env.ANALYZE = 'false';
    process.env.GITHUB_REPOSITORY = 'some/other-repo';
    const configExport = require('../next.config.js');
    const config = configExport;
    const mockWebpackConfig = {
      resolve: {},
      output: {},
      experiments: {}
    };
    const mockContext = { isServer: true };

    const webpackResult = config.webpack(mockWebpackConfig, mockContext);

    expect(webpackResult.resolve.fallback).toEqual({ fs: false });
    expect(webpackResult.output.webassemblyModuleFilename).toBe('static/wasm/[modulehash].wasm');
    expect(webpackResult.experiments).toEqual({ asyncWebAssembly: true, layers: true });
    expect(webpackResult.output.environment).toBeUndefined();
  });
});
