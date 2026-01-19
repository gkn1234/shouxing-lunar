/**
 * 行星位置计算 - Planet Position Calculations
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:955-1000 XL0_calc函数
 * @see eph0.js:1002-1018 p_coord函数
 * @see eph0.js:943-952 XL0_xzb修正表
 *
 * 使用 VSOP87 理论计算行星位置
 */

import { normalizeAngle, SphericalCoord } from '../core/coordinate';
import {
  calculateEarthLongitude,
  calculateEarthLatitude,
  calculateEarthSunDistance,
} from './sun';

// 导入各行星 VSOP87 数据
import {
  MERCURY_MULTIPLIER,
  MERCURY_L,
  MERCURY_B,
  MERCURY_R,
} from '../data/vsop87/mercury';
import {
  VENUS_MULTIPLIER,
  VENUS_L,
  VENUS_B,
  VENUS_R,
} from '../data/vsop87/venus';
import {
  MARS_MULTIPLIER,
  MARS_L,
  MARS_B,
  MARS_R,
} from '../data/vsop87/mars';
import {
  JUPITER_MULTIPLIER,
  JUPITER_L,
  JUPITER_B,
  JUPITER_R,
} from '../data/vsop87/jupiter';
import {
  SATURN_MULTIPLIER,
  SATURN_L,
  SATURN_B,
  SATURN_R,
} from '../data/vsop87/saturn';
import {
  URANUS_MULTIPLIER,
  URANUS_L,
  URANUS_B,
  URANUS_R,
} from '../data/vsop87/uranus';
import {
  NEPTUNE_MULTIPLIER,
  NEPTUNE_L,
  NEPTUNE_B,
  NEPTUNE_R,
} from '../data/vsop87/neptune';
import {
  PLUTO_MULTIPLIER,
  PLUTO_OFFSET,
  PLUTO_DATA,
} from '../data/vsop87/pluto';

/**
 * 行星编号
 */
export enum Planet {
  Earth = 0,
  Mercury = 1,
  Venus = 2,
  Mars = 3,
  Jupiter = 4,
  Saturn = 5,
  Uranus = 6,
  Neptune = 7,
  Pluto = 8,
  Sun = 9,
}

/**
 * 行星名称 (中文)
 */
export const PLANET_NAMES_CN = [
  '地球',
  '水星',
  '金星',
  '火星',
  '木星',
  '土星',
  '天王星',
  '海王星',
  '冥王星',
  '太阳',
];

/**
 * 行星名称 (英文)
 */
export const PLANET_NAMES_EN = [
  'Earth',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Sun',
];

/**
 * 行星星历修正表
 * @see eph0.js:943-952 XL0_xzb
 *
 * 每行3个值: [黄经修正(角秒), 黄纬修正(角秒), 距离修正(10^-6 AU)]
 * 顺序: 水星、金星、火星、木星、土星、天王星、海王星
 */
export const PLANET_CORRECTIONS = [
  [-0.08631, +0.00039, -0.00008], // 水星 Mercury
  [-0.07447, +0.00006, +0.00017], // 金星 Venus
  [-0.07135, -0.00026, -0.00176], // 火星 Mars
  [-0.20239, +0.00273, -0.00347], // 木星 Jupiter
  [-0.25486, +0.00276, +0.42926], // 土星 Saturn
  [+0.24588, +0.00345, -14.46266], // 天王星 Uranus
  [-0.95116, +0.02481, +58.30651], // 海王星 Neptune
];

/**
 * 行星会合周期 (天)
 * @see eph0.js cs_xxHH
 */
export const PLANET_SYNODIC_PERIODS = [
  0, // 地球 (无意义)
  116, // 水星
  584, // 金星
  780, // 火星
  399, // 木星
  378, // 土星
  370, // 天王星
  367, // 海王星
];

/**
 * 行星轨道周期 (年)
 */
export const PLANET_ORBITAL_PERIODS = [
  1.0, // 地球
  0.241, // 水星
  0.615, // 金星
  1.881, // 火星
  11.86, // 木星
  29.46, // 土星
  84.01, // 天王星
  164.8, // 海王星
];

/**
 * 行星 VSOP87 数据配置
 */
interface PlanetVSOP87Config {
  multiplier: number;
  L: number[][];
  B: number[][];
  R: number[][];
  corrections: number[]; // [黄经修正, 黄纬修正, 距离修正]
}

/**
 * 各行星 VSOP87 数据映射
 */
const PLANET_VSOP87_DATA: Record<number, PlanetVSOP87Config> = {
  [Planet.Mercury]: {
    multiplier: MERCURY_MULTIPLIER,
    L: MERCURY_L,
    B: MERCURY_B,
    R: MERCURY_R,
    corrections: PLANET_CORRECTIONS[0],
  },
  [Planet.Venus]: {
    multiplier: VENUS_MULTIPLIER,
    L: VENUS_L,
    B: VENUS_B,
    R: VENUS_R,
    corrections: PLANET_CORRECTIONS[1],
  },
  [Planet.Mars]: {
    multiplier: MARS_MULTIPLIER,
    L: MARS_L,
    B: MARS_B,
    R: MARS_R,
    corrections: PLANET_CORRECTIONS[2],
  },
  [Planet.Jupiter]: {
    multiplier: JUPITER_MULTIPLIER,
    L: JUPITER_L,
    B: JUPITER_B,
    R: JUPITER_R,
    corrections: PLANET_CORRECTIONS[3],
  },
  [Planet.Saturn]: {
    multiplier: SATURN_MULTIPLIER,
    L: SATURN_L,
    B: SATURN_B,
    R: SATURN_R,
    corrections: PLANET_CORRECTIONS[4],
  },
  [Planet.Uranus]: {
    multiplier: URANUS_MULTIPLIER,
    L: URANUS_L,
    B: URANUS_B,
    R: URANUS_R,
    corrections: PLANET_CORRECTIONS[5],
  },
  [Planet.Neptune]: {
    multiplier: NEPTUNE_MULTIPLIER,
    L: NEPTUNE_L,
    B: NEPTUNE_B,
    R: NEPTUNE_R,
    corrections: PLANET_CORRECTIONS[6],
  },
};

/**
 * 弧度转角秒常数
 */
const RAD_TO_ARCSEC = 180 * 3600 / Math.PI;

/**
 * 计算 VSOP87 级数求和
 * @see eph0.js:955-981 XL0_calc函数
 *
 * @param data - 级数数据数组 [振幅, 相位, 频率, ...]
 * @param t - 儒略千年数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 级数求和结果
 */
function calculateVSOP87Series(
  data: number[],
  t: number,
  termCount: number = -1
): number {
  if (data.length === 0) return 0;

  const totalTerms = Math.floor(data.length / 3);
  const n = termCount < 0 ? totalTerms : Math.min(termCount, totalTerms);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    const amplitude = data[idx];
    const phase = data[idx + 1];
    const frequency = data[idx + 2];
    sum += amplitude * Math.cos(phase + frequency * t);
  }

  return sum;
}

/**
 * 计算行星 VSOP87 坐标分量
 *
 * @param dataArrays - L0-L5 或 B0-B5 或 R0-R5 数据数组
 * @param multiplier - 数据倍率
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 坐标分量值
 */
function calculateVSOP87Component(
  dataArrays: number[][],
  multiplier: number,
  t: number,
  termCount: number = -1
): number {
  const tMillennia = t / 10; // 转为儒略千年数

  let result = 0;
  let tPower = 1;

  for (let i = 0; i < dataArrays.length; i++) {
    const data = dataArrays[i];
    if (data && data.length > 0) {
      let n = termCount;
      if (termCount > 0 && i > 0 && dataArrays[0].length > 0) {
        // 高次项使用较少的项数
        const ratio = (data.length / 3) / (dataArrays[0].length / 3);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateVSOP87Series(data, tMillennia, n);
      result += seriesSum * tPower;
    }
    tPower *= tMillennia;
  }

  return result / multiplier;
}

/**
 * 计算冥王星 J2000 直角坐标
 * @see eph0.js:984-1000 pluto_coord函数
 *
 * 冥王星使用与其他行星不同的计算方法
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @returns [X, Y, Z] 直角坐标 (AU)
 */
function calculatePlutoRectangular(t: number): [number, number, number] {
  const c0 = Math.PI / 180 / 100000;
  const x = -1 + 2 * (t * 36525 + 1825394.5) / 2185000;
  const T = t / 100000000;
  const r: [number, number, number] = [0, 0, 0];

  for (let i = 0; i < 9; i++) {
    const ob = PLUTO_DATA[i];
    const N = ob.length;
    let v = 0;

    for (let j = 0; j < N; j += 3) {
      v += ob[j] * Math.sin(ob[j + 1] * T + ob[j + 2] * c0);
    }

    if (i % 3 === 1) v *= x;
    if (i % 3 === 2) v *= x * x;

    r[Math.floor(i / 3)] += v / PLUTO_MULTIPLIER;
  }

  // 常数校正项
  r[0] += PLUTO_OFFSET.X[0] + PLUTO_OFFSET.X[1] * x;
  r[1] += PLUTO_OFFSET.Y[0] + PLUTO_OFFSET.Y[1] * x;
  r[2] += PLUTO_OFFSET.Z[0] + PLUTO_OFFSET.Z[1] * x;

  return r;
}

/**
 * 计算冥王星日心黄道坐标
 *
 * 注意：此函数为新增辅助函数，将 calculatePlutoRectangular 的直角坐标
 * 转换为球面坐标，以保持与其他行星接口一致。
 * 原始 eph0.js 的 pluto_coord 函数仅返回直角坐标。
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 冥王星日心黄道坐标 [黄经, 黄纬, 距离(AU)]
 */
function calculatePlutoHeliocentricCoord(t: number): SphericalCoord {
  const [x, y, z] = calculatePlutoRectangular(t);

  // 直角坐标转球坐标
  const distance = Math.sqrt(x * x + y * y + z * z);
  const lon = normalizeAngle(Math.atan2(y, x));
  const lat = Math.asin(z / distance);

  return [lon, lat, distance];
}

/**
 * 计算地球日心坐标
 * @see eph0.js:1020-1026 e_coord函数
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param n1 - 黄经项数 (-1 表示全部)
 * @param n2 - 黄纬项数 (-1 表示全部)
 * @param n3 - 距离项数 (-1 表示全部)
 * @returns 地球日心黄道坐标 [黄经, 黄纬, 距离(AU)]
 */
export function calculateEarthHeliocentricCoord(
  t: number,
  n1: number = -1,
  n2: number = -1,
  n3: number = -1
): SphericalCoord {
  return [
    calculateEarthLongitude(t, n1),
    calculateEarthLatitude(t, n2),
    calculateEarthSunDistance(t, n3),
  ];
}

/**
 * 计算行星日心坐标
 * @see eph0.js:1002-1018 p_coord函数
 *
 * 使用 VSOP87 理论精确计算行星日心黄道坐标
 *
 * @param planet - 行星编号
 * @param t - 儒略世纪数 (J2000起算)
 * @param n1 - 黄经项数 (-1 表示全部)
 * @param n2 - 黄纬项数 (-1 表示全部)
 * @param n3 - 距离项数 (-1 表示全部)
 * @returns 行星日心黄道坐标 [黄经, 黄纬, 距离(AU)]
 */
export function calculatePlanetHeliocentricCoord(
  planet: Planet,
  t: number,
  n1: number = -1,
  n2: number = -1,
  n3: number = -1
): SphericalCoord {
  // 地球使用专门的计算函数
  if (planet === Planet.Earth) {
    return calculateEarthHeliocentricCoord(t, n1, n2, n3);
  }

  // 太阳在日心坐标系中位于原点
  if (planet === Planet.Sun) {
    return [0, 0, 0];
  }

  // 冥王星使用专门的计算方法
  if (planet === Planet.Pluto) {
    return calculatePlutoHeliocentricCoord(t);
  }

  // 其他行星使用 VSOP87 数据
  const config = PLANET_VSOP87_DATA[planet];
  if (!config) {
    // 未知行星，返回零值
    return [0, 0, 0];
  }

  // 计算黄经、黄纬、距离
  let lon = calculateVSOP87Component(config.L, config.multiplier, t, n1);
  let lat = calculateVSOP87Component(config.B, config.multiplier, t, n2);
  let dist = calculateVSOP87Component(config.R, config.multiplier, t, n3);

  // 应用修正项 (角秒转弧度)
  const [lonCorr, latCorr, distCorr] = config.corrections;
  lon += lonCorr / RAD_TO_ARCSEC;
  lat += latCorr / RAD_TO_ARCSEC;
  dist += distCorr / 1000000; // 10^-6 AU

  return [normalizeAngle(lon), lat, dist];
}

/**
 * 计算行星地心坐标
 *
 * 将日心坐标转换为地心坐标（新增辅助函数，非 eph0.js 原有）
 *
 * @param planet - 行星编号
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 行星地心黄道坐标 [黄经, 黄纬, 距离(AU)]
 */
export function calculatePlanetGeocentricCoord(
  planet: Planet,
  t: number
): SphericalCoord {
  if (planet === Planet.Earth) {
    return [0, 0, 0]; // 地球在地心坐标系中位于原点
  }

  // 获取地球和行星的日心坐标
  const earth = calculateEarthHeliocentricCoord(t);
  const planetCoord = calculatePlanetHeliocentricCoord(planet, t);

  // 转换为直角坐标
  const earthX = earth[2] * Math.cos(earth[1]) * Math.cos(earth[0]);
  const earthY = earth[2] * Math.cos(earth[1]) * Math.sin(earth[0]);
  const earthZ = earth[2] * Math.sin(earth[1]);

  const planetX = planetCoord[2] * Math.cos(planetCoord[1]) * Math.cos(planetCoord[0]);
  const planetY = planetCoord[2] * Math.cos(planetCoord[1]) * Math.sin(planetCoord[0]);
  const planetZ = planetCoord[2] * Math.sin(planetCoord[1]);

  // 地心坐标 = 行星坐标 - 地球坐标
  const dx = planetX - earthX;
  const dy = planetY - earthY;
  const dz = planetZ - earthZ;

  // 转换回球坐标
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lon = normalizeAngle(Math.atan2(dy, dx));
  const lat = Math.asin(dz / distance);

  return [lon, lat, distance];
}

/**
 * 计算行星相位角 (地球-行星-太阳角)
 *
 * 新增辅助函数，使用余弦定理计算
 *
 * @param planet - 行星编号
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 相位角 (弧度, 0-π)
 */
export function calculatePlanetPhaseAngle(planet: Planet, t: number): number {
  const earth = calculateEarthHeliocentricCoord(t);
  const planetCoord = calculatePlanetHeliocentricCoord(planet, t);

  // 地球到太阳的向量 (负的地球位置)
  const sunFromEarth = earth[2];

  // 行星到太阳的距离
  const sunFromPlanet = planetCoord[2];

  // 地球到行星的距离
  const geocentric = calculatePlanetGeocentricCoord(planet, t);
  const earthToPlanet = geocentric[2];

  // 使用余弦定理计算相位角
  const cosPhase =
    (sunFromPlanet * sunFromPlanet +
      earthToPlanet * earthToPlanet -
      sunFromEarth * sunFromEarth) /
    (2 * sunFromPlanet * earthToPlanet);

  return Math.acos(Math.max(-1, Math.min(1, cosPhase)));
}

/**
 * 计算行星视星等 (简化公式)
 *
 * 新增辅助函数，使用标准天文公式
 *
 * @param planet - 行星编号
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 视星等
 */
export function calculatePlanetMagnitude(planet: Planet, t: number): number {
  // 行星绝对星等 (H) 和相位系数 (G)
  const magnitudeParams: Record<number, [number, number]> = {
    [Planet.Mercury]: [-0.36, 3.8],
    [Planet.Venus]: [-4.4, 0.09],
    [Planet.Mars]: [-1.52, 1.6],
    [Planet.Jupiter]: [-9.4, 0.5],
    [Planet.Saturn]: [-8.88, 0.044],
    [Planet.Uranus]: [-7.19, 0.028],
    [Planet.Neptune]: [-6.87, 0.0],
  };

  const params = magnitudeParams[planet];
  if (!params) return 0;

  const [H, G] = params;

  const geocentric = calculatePlanetGeocentricCoord(planet, t);
  const heliocentric = calculatePlanetHeliocentricCoord(planet, t);

  const r = heliocentric[2]; // 日心距离
  const delta = geocentric[2]; // 地心距离
  const phase = calculatePlanetPhaseAngle(planet, t);

  // 简化的相位函数
  const phaseFactor = (1 - G) * Math.cos(phase / 2) + G * Math.cos(phase);

  // 视星等公式
  return H + 5 * Math.log10(r * delta) - 2.5 * Math.log10(phaseFactor);
}

/**
 * 判断行星是否在顺行
 *
 * 新增辅助函数，通过数值微分判断黄经变化方向
 *
 * @param planet - 行星编号
 * @param t - 儒略世纪数 (J2000起算)
 * @returns true 表示顺行, false 表示逆行
 */
export function isPlanetDirect(planet: Planet, t: number): boolean {
  const dt = 0.0001; // 约 3.65 天
  const lon1 = calculatePlanetGeocentricCoord(planet, t)[0];
  const lon2 = calculatePlanetGeocentricCoord(planet, t + dt)[0];

  // 计算黄经变化 (考虑跨越 0°/360° 的情况)
  let dLon = lon2 - lon1;
  if (dLon > Math.PI) dLon -= 2 * Math.PI;
  if (dLon < -Math.PI) dLon += 2 * Math.PI;

  return dLon > 0;
}

/**
 * 天文单位转千米
 */
export const AU_TO_KM = 149597870.7;

/**
 * 光速 (km/s)
 */
export const SPEED_OF_LIGHT = 299792.458;

/**
 * 计算行星光行时间
 *
 * 新增辅助函数，根据距离和光速计算
 *
 * @param distance - 距离 (AU)
 * @returns 光行时间 (天)
 */
export function calculateLightTime(distance: number): number {
  // 1 AU 的光行时间约为 499 秒 = 0.00577 天
  return (distance * AU_TO_KM) / SPEED_OF_LIGHT / 86400;
}
