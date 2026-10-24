import { describe, it, expect } from 'vitest';
import { parseArduinoLine, LineBuffer } from './parser';

describe('Arduino Serial Parser', () => {
  it('correctly parses demo telemetry line', () => {
    const line = '[t=12s]  [DEMO] Sun: 72  East: 592  West: 609  Diff: -17  Target: 72  Servo: 70';
    const result = parseArduinoLine(line);

    expect(result.type).toBe('telemetry');
    expect(result.telemetry).toBeDefined();
    expect(result.telemetry?.t).toBe(12);
    expect(result.telemetry?.mode).toBe('DEMO');
    expect(result.telemetry?.sun).toBe(72);
    expect(result.telemetry?.east).toBe(592);
    expect(result.telemetry?.west).toBe(609);
    expect(result.telemetry?.diff).toBe(-17);
    expect(result.telemetry?.target).toBe(72);
    expect(result.telemetry?.servo).toBe(70);
  });

  it('correctly parses live telemetry line without Sun', () => {
    const line = '[t=45s]  East: 850  West: 420  Diff: 430  Target: 110  Servo: 108';
    const result = parseArduinoLine(line);

    expect(result.type).toBe('telemetry');
    expect(result.telemetry?.t).toBe(45);
    expect(result.telemetry?.mode).toBe('LIVE');
    expect(result.telemetry?.sun).toBeNull();
    expect(result.telemetry?.east).toBe(850);
    expect(result.telemetry?.west).toBe(420);
    expect(result.telemetry?.diff).toBe(430);
    expect(result.telemetry?.target).toBe(110);
    expect(result.telemetry?.servo).toBe(108);
  });

  it('parses status response line', () => {
    const line = 'Mode: LIVE  Tracking: ON  Threshold: 10  Print every: 1000 ms  Target: 90  Servo: 90';
    const result = parseArduinoLine(line);

    expect(result.type).toBe('status');
    expect(result.status).toEqual({
      mode: 'LIVE',
      tracking: true,
      threshold: 10,
      printIntervalMs: 1000,
      target: 90,
      servo: 90,
    });
  });

  it('parses OK command responses', () => {
    const result1 = parseArduinoLine('OK: tracking paused');
    expect(result1.type).toBe('response');
    expect(result1.message).toBe('OK: tracking paused');
    expect(result1.logType).toBe('response');

    const result2 = parseArduinoLine('OK: threshold = 15');
    expect(result2.type).toBe('response');

    const result3 = parseArduinoLine('OK: DEMO ON - sun crosses in 20 s');
    expect(result3.type).toBe('response');
  });

  it('parses error lines', () => {
    const result = parseArduinoLine('ERR: angle must be 30-150');
    expect(result.type).toBe('error');
    expect(result.logType).toBe('error');
  });

  it('parses info lines like ready boot messages', () => {
    const result = parseArduinoLine('Solar tracker ready...');
    expect(result.type).toBe('info');
    expect(result.message).toBe('Solar tracker ready...');
  });

  it('ignores empty or whitespace-only lines', () => {
    expect(parseArduinoLine('').type).toBe('ignored');
    expect(parseArduinoLine('   \n\t ').type).toBe('ignored');
  });

  it('buffers and splits multi-chunk serial input properly', () => {
    const buffer = new LineBuffer();

    const chunk1 = '[t=1s]  East: 500  West: ';
    const lines1 = buffer.push(chunk1);
    expect(lines1).toEqual([]);

    const chunk2 = '500  Diff: 0  Target: 90  Servo: 90\nOK: status';
    const lines2 = buffer.push(chunk2);
    expect(lines2).toEqual(['[t=1s]  East: 500  West: 500  Diff: 0  Target: 90  Servo: 90']);

    const chunk3 = '\n';
    const lines3 = buffer.push(chunk3);
    expect(lines3).toEqual(['OK: status']);
  });
});
