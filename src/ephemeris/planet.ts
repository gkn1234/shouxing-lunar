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
 * 注意: 完整实现需要各行星的VSOP87数据
 * 当前版本仅支持地球和太阳
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
  switch (planet) {
    case Planet.Earth:
      return calculateEarthHeliocentricCoord(t, n1, n2, n3);

    case Planet.Sun:
      // 太阳在日心坐标系中位于原点
      return [0, 0, 0];

    default:
      // 其他行星需要完整VSOP87数据
      // 这里返回简化估算值 (用于演示)
      return estimatePlanetPosition(planet, t);
  }
}

/**
 * 简化行星位置估算 (基于开普勒轨道)
 *
 * 仅用于演示，精度较低
 *
 * @param planet - 行星编号
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 估算的日心黄道坐标
 */
function estimatePlanetPosition(planet: Planet, t: number): SphericalCoord {
  // 行星轨道参数 (J2000.0)
  // [平黄经(弧度), 平均运动(弧度/世纪), 轨道半长轴(AU), 轨道离心率, 轨道倾角(弧度)]
  const orbitalElements: Record<number, number[]> = {
    [Planet.Mercury]: [4.40261, 2608.7903, 0.387, 0.2056, 0.1222],
    [Planet.Venus]: [3.17615, 1021.3286, 0.723, 0.0068, 0.0592],
    [Planet.Mars]: [6.20348, 334.0613, 1.524, 0.0934, 0.0323],
    [Planet.Jupiter]: [0.59955, 52.9691, 5.203, 0.0484, 0.0228],
    [Planet.Saturn]: [0.87402, 21.3299, 9.537, 0.0542, 0.0434],
    [Planet.Uranus]: [5.48129, 7.4782, 19.19, 0.0472, 0.0135],
    [Planet.Neptune]: [5.31188, 3.8133, 30.07, 0.0086, 0.0309],
  };

  const elements = orbitalElements[planet];
  if (!elements) {
    return [0, 0, 1];
  }

  const [L0, n, a] = elements;

  // 平黄经
  const L = normalizeAngle(L0 + n * t);

  // 简化: 假设圆轨道 (实际应解开普勒方程)
  const lon = L;
  const lat = 0; // 简化: 忽略轨道倾角
  const r = a; // 简化: 忽略离心率

  return [lon, lat, r];
}

/**
 * 计算行星地心坐标
 *
 * 将日心坐标转换为地心坐标
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
 * @param distance - 距离 (AU)
 * @returns 光行时间 (天)
 */
export function calculateLightTime(distance: number): number {
  // 1 AU 的光行时间约为 499 秒 = 0.00577 天
  return (distance * AU_TO_KM) / SPEED_OF_LIGHT / 86400;
}
