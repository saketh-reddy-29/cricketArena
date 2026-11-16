import { describe, expect, it } from 'vitest';
import { COUNTRY_KITS, colourDistance, pickVariants, resolveKit, toKitFormat, applyRole } from '../characters/teamKits';

const hue = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1e-9;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; return (h + 360) % 360;
};
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

describe('teamKits', () => {
  it('covers the 14 required countries', () => {
    const names = COUNTRY_KITS.map((k) => k.name);
    for (const n of ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand', 'Sri Lanka', 'Bangladesh', 'West Indies', 'Afghanistan', 'Zimbabwe', 'Ireland', 'Netherlands', 'Nepal']) {
      expect(names).toContain(n);
    }
  });

  it('resolves by name, code and case', () => {
    expect(resolveKit('INDIA', 'ODI').teamId).toBe('IND');
    expect(resolveKit('ind', 'ODI').teamId).toBe('IND');
    expect(resolveKit('South Africa', 'ODI').teamId).toBe('SA');
  });

  it('maps IPL to the T20 kit', () => {
    expect(toKitFormat('IPL')).toBe('T20');
    expect(toKitFormat('TEST')).toBe('TEST');
    expect(toKitFormat(undefined)).toBe('T20');
  });

  it('ODI kits use the country colours', () => {
    const blue = (h: string) => hue(h) > 200 && hue(h) < 240;
    const green = (h: string) => hue(h) > 100 && hue(h) < 170;
    expect(blue(resolveKit('India', 'ODI').slots.jersey)).toBe(true);
    expect(green(resolveKit('Pakistan', 'ODI').slots.jersey)).toBe(true);
    expect(green(resolveKit('South Africa', 'ODI').slots.jersey)).toBe(true);
    expect(resolveKit('South Africa', 'ODI').slots.collar).toBe('#ffc20e');
    const aus = resolveKit('Australia', 'ODI').slots;
    expect(hue(aus.jersey)).toBeGreaterThan(35);
    expect(hue(aus.jersey)).toBeLessThan(55);
    expect(hue(aus.collar)).toBeGreaterThan(120);
    expect(lum(resolveKit('New Zealand', 'ODI').slots.jersey)).toBeLessThan(0.15);
  });

  it('Test kits are white clothing with team-coloured helmet', () => {
    for (const c of COUNTRY_KITS) {
      const k = resolveKit(c.name, 'TEST').slots;
      for (const slot of [k.jersey, k.sleeves, k.pants, k.pads, k.socks]) expect(lum(slot)).toBeGreaterThan(0.9);
      expect(k.helmet).toBe(c.primary);
    }
  });

  it('T20 kits add colour blocking (sleeves differ from jersey for most teams)', () => {
    const blocked = COUNTRY_KITS.filter((c) => { const k = resolveKit(c.name, 'T20').slots; return k.sleeves !== k.jersey; });
    expect(blocked.length).toBeGreaterThanOrEqual(12);
  });

  it('never recolours skin: kit slots contain no skin/hair slot', () => {
    const keys = Object.keys(resolveKit('India', 'T20').slots);
    expect(keys).not.toContain('skin');
    expect(keys).not.toContain('hair');
  });

  it('unknown / franchise teams get a stable distinct palette', () => {
    const a = resolveKit('Mumbai Indians', 'T20').slots.jersey;
    expect(a).toBe(resolveKit('Mumbai Indians', 'T20').slots.jersey);
    const x = resolveKit('Zork Zebras', 'ODI').slots.jersey;
    expect(x).toBe(resolveKit('Zork Zebras', 'ODI').slots.jersey);
    expect(x).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('switches the bowling side to away when shirts clash (India v Sri Lanka)', () => {
    expect(pickVariants('India', 'Sri Lanka', 'ODI').bowling).toBe('away');
    expect(pickVariants('India', 'Australia', 'ODI').bowling).toBe('home');
    const away = resolveKit('Sri Lanka', 'ODI', 'away').slots.jersey;
    expect(colourDistance(away, resolveKit('India', 'ODI').slots.jersey)).toBeGreaterThan(200);
  });

  it('roles: batters/keeper wear helmets, fielders do not; padless model gets bare hands', () => {
    const kit = resolveKit('India', 'ODI');
    expect(applyRole(kit, 'batter', true).helmet).toBe(true);
    expect(applyRole(kit, 'keeper', true).helmet).toBe(true);
    expect(applyRole(kit, 'fielder', false).helmet).toBe(false);
    expect(applyRole(kit, 'fielder', false).slots.gloves).toBe('#dca98a');
  });

  it('umpire role uses neutral official clothing in every match format and no batting helmet', () => {
    for (const format of ['TEST', 'ODI', 'T20']) {
      const official = applyRole(resolveKit('India', format), 'umpire', false);
      expect(official.helmet).toBe(false);
      expect(official.slots.jersey).toBe('#f4f4f1');
      expect(official.slots.sleeves).toBe('#f4f4f1');
      expect(official.slots.pants).toBe('#111827');
      expect(official.slots.shoes).toBe('#f8fafc');
      expect(official.slots.gloves).toBe('#dca98a');
    }
  });
});
