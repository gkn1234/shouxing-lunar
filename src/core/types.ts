/**
 * 单位类型系统 - 使用品牌类型防止单位混淆
 */

export type Radians = number & { readonly __brand: 'radians' };
export type Degrees = number & { readonly __brand: 'degrees' };
export type ArcSeconds = number & { readonly __brand: 'arcSeconds' };
export type JulianDay = number & { readonly __brand: 'julianDay' };
export type JulianCentury = number & { readonly __brand: 'julianCentury' };

export function toRadians(degrees: Degrees): Radians {
  return (degrees * Math.PI / 180) as Radians;
}

export function toDegrees(radians: Radians): Degrees {
  return (radians * 180 / Math.PI) as Degrees;
}

export function toArcSeconds(degrees: Degrees): ArcSeconds {
  return (degrees * 3600) as ArcSeconds;
}

export function fromArcSeconds(arcSeconds: ArcSeconds): Degrees {
  return (arcSeconds / 3600) as Degrees;
}

export function asRadians(value: number): Radians {
  return value as Radians;
}

export function asDegrees(value: number): Degrees {
  return value as Degrees;
}

export function asArcSeconds(value: number): ArcSeconds {
  return value as ArcSeconds;
}

export function asJulianDay(value: number): JulianDay {
  return value as JulianDay;
}

export function asJulianCentury(value: number): JulianCentury {
  return value as JulianCentury;
}
