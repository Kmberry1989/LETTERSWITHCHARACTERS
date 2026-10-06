import { describe, expect, it } from 'vitest';
import { getWheelGesture, getWheelResultIndex, getWheelSolveBonus } from '@/components/minigames/wheel-game';

describe('wheel gesture physics', () => {
  const center = { x: 100, y: 100 };

  it('uses gesture direction and speed', () => {
    const clockwise = getWheelGesture([
      { x: 100, y: 20, time: 0 },
      { x: 180, y: 100, time: 80 },
    ], center);
    const counterclockwise = getWheelGesture([
      { x: 100, y: 20, time: 0 },
      { x: 20, y: 100, time: 80 },
    ], center);

    expect(clockwise.direction).toBe(1);
    expect(counterclockwise.direction).toBe(-1);
    expect(clockwise.strength).toBeGreaterThan(0.8);
    expect(counterclockwise.strength).toBeGreaterThan(0.8);
  });

  it('maps the wheel orientation beneath the fixed top indicator', () => {
    expect(getWheelResultIndex(-15)).toBe(0);
    expect(getWheelResultIndex(-45)).toBe(1);
    expect(getWheelResultIndex(15)).toBe(11);
  });

  it('rewards an earlier solve more than a nearly revealed solve', () => {
    const early = getWheelSolveBonus('STORY BOOK', []);
    const late = getWheelSolveBonus('STORY BOOK', ['S', 'T', 'O', 'R', 'Y', 'B']);

    expect(early).toBe(2750);
    expect(late).toBe(1250);
    expect(early).toBeGreaterThan(late);
  });
});
