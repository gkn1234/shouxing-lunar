/**
 * 岁差计算 - Precession Calculations
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:396-493 岁差计算相关代码
 *
 * 岁差是地球自转轴的长期进动，导致春分点沿黄道西移
 *
 * 支持的岁差模型：
 * - IAU1976: 1976年国际天文学联合会模型
 * - IAU2000: 2000年模型
 * - P03: 2003年高精度模型
 */

import { RAD } from './constants';
import { normalizeAngle, rotateSpherical, SphericalCoord } from './coordinate';

/**
 * 岁差模型类型
 */
export type PrecessionModel = 'IAU1976' | 'IAU2000' | 'P03';

/**
 * 岁差参数名称
 */
export type PrecessionParameter =
  | 'fi'  // φ
  | 'w'   // ω (黄道倾角)
  | 'P'   // P
  | 'Q'   // Q
  | 'E'   // ε (黄赤交角)
  | 'x'   // χ
  | 'pi'  // π
  | 'II'  // Π
  | 'p'   // p (一般岁差)
  | 'th'  // θ
  | 'Z'   // ζ_A
  | 'z';  // z_A

/**
 * IAU1976 岁差表
 * @see eph0.js:398-412 preceTab_IAU1976数组
 *
 * 每行4个系数：a0, a1, a2, a3
 */
const PRECESSION_IAU1976: number[] = [
  0, 5038.7784, -1.07259, -0.001147, // φ
  84381.448, 0, 0.05127, -0.007726, // ω
  0, 4.1976, 0.19447, -0.000179, // P
  0, -46.815, 0.05059, 0.000344, // Q
  84381.448, -46.815, -0.00059, 0.001813, // ε
  0, 10.5526, -2.38064, -0.001125, // χ
  0, 47.0028, -0.03301, 0.000057, // π
  629554.886, -869.8192, 0.03666, -0.001504, // Π
  0, 5029.0966, 1.11113, 0.000006, // p
  0, 2004.3109, -0.42665, -0.041833, // θ
  0, 2306.2181, 0.30188, 0.017998, // ζ_A
  0, 2306.2181, 1.09468, 0.018203, // z_A
];

/**
 * IAU2000 岁差表
 * @see eph0.js:413-428 preceTab_IAU2000数组
 *
 * 每行6个系数：a0, a1, a2, a3, a4, a5
 */
const PRECESSION_IAU2000: number[] = [
  0, 5038.47875, -1.07259, -0.001147, 0, 0, // φ
  84381.448, -0.02524, 0.05127, -0.007726, 0, 0, // ω
  0, 4.1976, 0.19447, -0.000179, 0, 0, // P
  0, -46.815, 0.05059, 0.000344, 0, 0, // Q
  84381.448, -46.84024, -0.00059, 0.001813, 0, 0, // ε
  0, 10.5526, -2.38064, -0.001125, 0, 0, // χ
  0, 47.0028, -0.03301, 0.000057, 0, 0, // π
  629554.886, -869.8192, 0.03666, -0.001504, 0, 0, // Π
  0, 5028.79695, 1.11113, 0.000006, 0, 0, // p
  0, 2004.1917476, -0.4269353, -0.0418251, -0.0000601, -0.0000001, // θ
  2.5976176, 2306.0809506, 0.3019015, 0.0179663, -0.0000327, -0.0000002, // ζ_A
  -2.5976176, 2306.0803226, 1.094779, 0.0182273, 0.000047, -0.0000003, // z_A
];

/**
 * P03 岁差表 (高精度)
 * @see eph0.js:429-442 preceTab_P03数组
 *
 * 每行6个系数：a0, a1, a2, a3, a4, a5
 */
const PRECESSION_P03: number[] = [
  0, 5038.481507, -1.0790069, -0.00114045, 0.000132851, -9.51e-8, // φ
  84381.406, -0.025754, 0.0512623, -0.00772503, -4.67e-7, 3.337e-7, // ω
  0, 4.199094, 0.1939873, -0.00022466, -9.12e-7, 1.2e-8, // P
  0, -46.811015, 0.0510283, 0.00052413, -6.46e-7, -1.72e-8, // Q
  84381.406, -46.836769, -0.0001831, 0.0020034, -5.76e-7, -4.34e-8, // ε
  0, 10.556403, -2.3814292, -0.00121197, 0.000170663, -5.6e-8, // χ
  0, 46.998973, -0.0334926, -0.00012559, 1.13e-7, -2.2e-9, // π
  629546.7936, -867.95758, 0.157992, -0.0005371, -0.00004797, 7.2e-8, // Π
  0, 5028.796195, 1.1054348, 0.00007964, -0.000023857, 3.83e-8, // p
  0, 2004.191903, -0.4294934, -0.04182264, -7.089e-6, -1.274e-7, // θ
  2.650545, 2306.083227, 0.2988499, 0.01801828, -5.971e-6, -3.173e-7, // ζ_A
  -2.650545, 2306.077181, 1.0927348, 0.01826837, -0.000028596, -2.904e-7, // z_A
];

/**
 * 岁差参数索引映射
 */
const PARAMETER_INDEX: Record<PrecessionParameter, number> = {
  fi: 0, w: 1, P: 2, Q: 3, E: 4, x: 5, pi: 6, II: 7, p: 8, th: 9, Z: 10, z: 11,
};

/**
 * 计算岁差参数
 * @see eph0.js:443-455 prece函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @param parameter - 岁差参数名称
 * @param model - 岁差模型
 * @returns 岁差参数值 (弧度)
 */
export function calculatePrecessionParameter(
  julianCentury: number,
  parameter: PrecessionParameter,
  model: PrecessionModel = 'P03'
): number {
  let table: number[];
  let coefficientCount: number;

  switch (model) {
    case 'IAU1976':
      table = PRECESSION_IAU1976;
      coefficientCount = 4;
      break;
    case 'IAU2000':
      table = PRECESSION_IAU2000;
      coefficientCount = 6;
      break;
    case 'P03':
    default:
      table = PRECESSION_P03;
      coefficientCount = 6;
      break;
  }

  const paramIndex = PARAMETER_INDEX[parameter];
  const baseIndex = paramIndex * coefficientCount;

  // 计算多项式
  let result = 0;
  let tPower = 1;

  for (let i = 0; i < coefficientCount; i++) {
    result += table[baseIndex + i] * tPower;
    tPower *= julianCentury;
  }

  // 角秒转弧度
  return result / RAD;
}

/**
 * 计算 P03 模型的黄赤交角
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @returns 黄赤交角 (弧度)
 */
export function calculateObliquity(julianCentury: number): number {
  const t = julianCentury;
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  // P03 模型的黄赤交角 (角秒)
  const obliquityArcSec =
    84381.406 - 46.836769 * t - 0.0001831 * t2 + 0.0020034 * t3 - 5.76e-7 * t4 - 4.34e-8 * t5;

  return obliquityArcSec / RAD;
}

/**
 * J2000 赤道坐标转历元赤道坐标 (岁差旋转)
 * @see eph0.js:459-469 CDllr_J2D函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @param coord - J2000 赤道坐标 [赤经, 赤纬, 距离]
 * @param model - 岁差模型
 * @returns 历元赤道坐标
 */
export function equatorialJ2000ToDate(
  julianCentury: number,
  coord: SphericalCoord,
  model: PrecessionModel = 'P03'
): SphericalCoord {
  const zetaA = calculatePrecessionParameter(julianCentury, 'Z', model);
  const zA = calculatePrecessionParameter(julianCentury, 'z', model);
  const theta = calculatePrecessionParameter(julianCentury, 'th', model);

  const [rightAscension, declination, distance] = coord;

  // 应用岁差旋转
  const adjustedRA = rightAscension + zetaA;

  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosDec = Math.cos(declination);
  const sinDec = Math.sin(declination);
  const sinAdjRA = Math.sin(adjustedRA);
  const cosAdjRA = Math.cos(adjustedRA);

  const rotationX = cosDec * sinAdjRA;
  const rotationY = cosTheta * cosDec * cosAdjRA - sinTheta * sinDec;
  const rotationZ = sinTheta * cosDec * cosAdjRA + cosTheta * sinDec;

  const newRA = normalizeAngle(Math.atan2(rotationX, rotationY) + zA);
  const newDec = Math.asin(rotationZ);

  return [newRA, newDec, distance];
}

/**
 * 历元赤道坐标转 J2000 赤道坐标 (逆岁差旋转)
 * @see eph0.js:470-480 CDllr_D2J函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @param coord - 历元赤道坐标 [赤经, 赤纬, 距离]
 * @param model - 岁差模型
 * @returns J2000 赤道坐标
 */
export function equatorialDateToJ2000(
  julianCentury: number,
  coord: SphericalCoord,
  model: PrecessionModel = 'P03'
): SphericalCoord {
  // 使用负参数进行逆旋转
  const zetaA = -calculatePrecessionParameter(julianCentury, 'z', model);
  const zA = -calculatePrecessionParameter(julianCentury, 'Z', model);
  const theta = -calculatePrecessionParameter(julianCentury, 'th', model);

  const [rightAscension, declination, distance] = coord;

  const adjustedRA = rightAscension + zetaA;

  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosDec = Math.cos(declination);
  const sinDec = Math.sin(declination);
  const sinAdjRA = Math.sin(adjustedRA);
  const cosAdjRA = Math.cos(adjustedRA);

  const rotationX = cosDec * sinAdjRA;
  const rotationY = cosTheta * cosDec * cosAdjRA - sinTheta * sinDec;
  const rotationZ = sinTheta * cosDec * cosAdjRA + cosTheta * sinDec;

  const newRA = normalizeAngle(Math.atan2(rotationX, rotationY) + zA);
  const newDec = Math.asin(rotationZ);

  return [newRA, newDec, distance];
}

/**
 * J2000 黄道坐标转历元黄道坐标
 * @see eph0.js:481-486 HDllr_J2D函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @param coord - J2000 黄道坐标 [黄经, 黄纬, 距离]
 * @param model - 岁差模型
 * @returns 历元黄道坐标
 */
export function eclipticJ2000ToDate(
  julianCentury: number,
  coord: SphericalCoord,
  model: PrecessionModel = 'P03'
): SphericalCoord {
  const phi = calculatePrecessionParameter(julianCentury, 'fi', model);
  const omega = calculatePrecessionParameter(julianCentury, 'w', model);
  const chi = calculatePrecessionParameter(julianCentury, 'x', model);
  const obliquity = calculatePrecessionParameter(julianCentury, 'E', model);

  // 多步旋转
  let result: SphericalCoord = [coord[0] + phi, coord[1], coord[2]];
  result = rotateSpherical(result, omega);
  result[0] = result[0] - chi;
  result = rotateSpherical(result, -obliquity);

  return result;
}

/**
 * 历元黄道坐标转 J2000 黄道坐标
 * @see eph0.js:488-493 HDllr_D2J函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @param coord - 历元黄道坐标 [黄经, 黄纬, 距离]
 * @param model - 岁差模型
 * @returns J2000 黄道坐标
 */
export function eclipticDateToJ2000(
  julianCentury: number,
  coord: SphericalCoord,
  model: PrecessionModel = 'P03'
): SphericalCoord {
  const phi = calculatePrecessionParameter(julianCentury, 'fi', model);
  const omega = calculatePrecessionParameter(julianCentury, 'w', model);
  const chi = calculatePrecessionParameter(julianCentury, 'x', model);
  const obliquity = calculatePrecessionParameter(julianCentury, 'E', model);

  // 逆向多步旋转
  let result = rotateSpherical(coord, obliquity);
  result[0] = result[0] + chi;
  result = rotateSpherical(result, -omega);
  result[0] = result[0] - phi;
  result[0] = normalizeAngle(result[0]);

  return result;
}
