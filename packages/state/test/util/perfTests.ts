import { expect } from 'vitest';
import { FrameworkInfo, TestConfig } from './frameworkTypes';

export interface TestResult {
  sum: number;
  count: number;
}

export interface TimingResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

export function verifyBenchResult(
  perfFramework: FrameworkInfo,
  config: TestConfig,
  timedResult: TimingResult<TestResult>
): void {
  const { testPullCounts, framework } = perfFramework;
  const { expected } = config;
  const { result } = timedResult;

  if (expected.sum) {
    expect(result.sum).toBe(expected.sum);
    // `sum ${framework.name} ${config.name} result:${result.sum} expected:${expected.sum}`
  }
  if (expected.count && (config.readFraction === 1 || testPullCounts)) {
    expect(result.count).toBe(expected.count);
    //   `count ${framework.name} ${config.name} result:${result.count} expected:${expected.count}`
    // );
  }
}
