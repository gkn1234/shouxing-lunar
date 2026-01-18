/**
 * 坐标系转换 - Coordinate System Transformations
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:140-212 坐标转换相关函数
 * 提供球面坐标与直角坐标转换、黄道与赤道坐标转换等功能
 */

import { PI2 } from './constants';

/**
 * 球面坐标 [经度, 纬度, 距离]
 */
export type SphericalCoord = [number, number, number];

/**
 * 直角坐标 [x, y, z]
 */
export type RectangularCoord = [number, number, number];

/**
 * 将角度规范化到 0-2π 范围
 * @see eph0.js:140-145 rad2mrad函数
 *
 * @param angle - 角度 (弧度)
 * @returns 规范化后的角度 (0 到 2π)
 */
export function normalizeAngle(angle: number): number {
  let normalizedAngle = angle % PI2;
  if (normalizedAngle < 0) {
    return normalizedAngle + PI2;
  }
  return normalizedAngle;
}

/**
 * 将角度规范化到 -π 到 π 范围
 * @see eph0.js:146-154 rad2rrad函数
 *
 * @param angle - 角度 (弧度)
 * @returns 规范化后的角度 (-π 到 π)
 */
export function normalizeAngleSigned(angle: number): number {
  let normalizedAngle = angle % PI2;
  if (normalizedAngle <= -Math.PI) {
    return normalizedAngle + PI2;
  }
  if (normalizedAngle > Math.PI) {
    return normalizedAngle - PI2;
  }
  return normalizedAngle;
}

/**
 * 临界余数 (dividend与最近的整倍数divisor相差的距离)
 * @see eph0.js:42 mod2函数
 *
 * @param dividend - 被除数
 * @param divisor - 除数
 * @returns 临界余数
 */
export function mod2(dividend: number, divisor: number): number {
  let remainder = (dividend + divisor) % divisor;
  if (remainder > divisor / 2.0) {
    remainder -= divisor;
  }
  return remainder;
}

/**
 * 球面坐标转直角坐标
 * @see eph0.js:164-169 llr2xyz函数
 *
 * @param coord - 球面坐标 [经度λ, 纬度β, 距离r]
 * @returns 直角坐标 [x, y, z]
 */
export function sphericalToRectangular(coord: SphericalCoord): RectangularCoord {
  const [lambda, beta, r] = coord;
  const cosBeta = Math.cos(beta);
  return [r * cosBeta * Math.cos(lambda), r * cosBeta * Math.sin(lambda), r * Math.sin(beta)];
}

/**
 * 直角坐标转球面坐标
 * @see eph0.js:171-177 xyz2llr函数
 *
 * @param coord - 直角坐标 [x, y, z]
 * @returns 球面坐标 [经度λ, 纬度β, 距离r]
 */
export function rectangularToSpherical(coord: RectangularCoord): SphericalCoord {
  const [x, y, z] = coord;
  const r = Math.sqrt(x * x + y * y + z * z);
  const beta = Math.asin(z / r);
  const lambda = normalizeAngle(Math.atan2(y, x));
  return [lambda, beta, r];
}

/**
 * 球面坐标旋转 (黄道/赤道坐标变换)
 * @see eph0.js:179-186 llrConv函数
 *
 * @param coord - 球面坐标 [经度, 纬度, 距离]
 * @param epsilon - 旋转角度 (黄赤交角，赤道转黄道用正值，黄道转赤道用负值)
 * @returns 旋转后的球面坐标
 */
export function rotateSpherical(coord: SphericalCoord, epsilon: number): SphericalCoord {
  const [lambda, beta, r] = coord;
  const sinE = Math.sin(epsilon);
  const cosE = Math.cos(epsilon);
  const sinL = Math.sin(lambda);
  const cosL = Math.cos(lambda);
  const sinB = Math.sin(beta);
  const cosB = Math.cos(beta);
  const tanB = Math.tan(beta);

  const newLambda = Math.atan2(sinL * cosE - tanB * sinE, cosL);
  const newBeta = Math.asin(cosE * sinB + sinE * cosB * sinL);

  return [normalizeAngle(newLambda), newBeta, r];
}

/**
 * 黄道坐标转赤道坐标
 *
 * @param ecliptic - 黄道坐标 [黄经λ, 黄纬β, 距离r]
 * @param epsilon - 黄赤交角 (弧度)
 * @returns 赤道坐标 [赤经α, 赤纬δ, 距离r]
 */
export function eclipticToEquatorial(ecliptic: SphericalCoord, epsilon: number): SphericalCoord {
  return rotateSpherical(ecliptic, epsilon);
}

/**
 * 赤道坐标转黄道坐标
 *
 * @param equatorial - 赤道坐标 [赤经α, 赤纬δ, 距离r]
 * @param epsilon - 黄赤交角 (弧度)
 * @returns 黄道坐标 [黄经λ, 黄纬β, 距离r]
 */
export function equatorialToEcliptic(equatorial: SphericalCoord, epsilon: number): SphericalCoord {
  return rotateSpherical(equatorial, -epsilon);
}

/**
 * 赤道坐标转地平坐标
 * @see eph0.js:188-192 CD2DP函数
 *
 * @param equatorial - 赤道坐标 [赤经α, 赤纬δ, 距离r]
 * @param longitude - 观测点经度 (弧度，东正西负)
 * @param latitude - 观测点纬度 (弧度)
 * @param gst - 格林尼治恒星时 (弧度)
 * @returns 地平坐标 [方位角A, 高度角h, 距离r]
 */
export function equatorialToHorizontal(
  equatorial: SphericalCoord,
  longitude: number,
  latitude: number,
  gst: number
): SphericalCoord {
  const [ra, dec, r] = equatorial;
  // 转到相对于地平赤道分点的赤道坐标
  const localEquatorial: SphericalCoord = [ra + Math.PI / 2 - gst - longitude, dec, r];
  // 旋转到地平坐标系
  const horizontalCoord = rotateSpherical(localEquatorial, Math.PI / 2 - latitude);
  // 调整方位角
  horizontalCoord[0] = normalizeAngle(-Math.PI / 2 - horizontalCoord[0]);
  return horizontalCoord;
}

/**
 * 计算两点之间的角距离
 *
 * @param lon1 - 第一点经度 (弧度)
 * @param lat1 - 第一点纬度 (弧度)
 * @param lon2 - 第二点经度 (弧度)
 * @param lat2 - 第二点纬度 (弧度)
 * @returns 角距离 (弧度)
 */
export function angularDistance(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const dLon = normalizeAngleSigned(lon1 - lon2);
  const dLat = lat1 - lat2;

  // 对于小角度使用近似公式
  if (Math.abs(dLon) < 1 / 1000 && Math.abs(dLat) < 1 / 1000) {
    const dLonCorrected = dLon * Math.cos((lat1 + lat2) / 2);
    return Math.sqrt(dLonCorrected * dLonCorrected + dLat * dLat);
  }

  // 对于大角度使用球面三角公式
  return Math.acos(
    Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)
  );
}

/**
 * 日心球面坐标转地心球面坐标
 * @see eph0.js:202-207 h2g函数
 *
 * @param heliocentric - 星体的日心球面坐标
 * @param earth - 地球的日心球面坐标
 * @returns 星体的地心球面坐标
 */
export function heliocentricToGeocentric(
  heliocentric: SphericalCoord,
  earth: SphericalCoord
): SphericalCoord {
  const earthXYZ = sphericalToRectangular(earth);
  const bodyXYZ = sphericalToRectangular(heliocentric);

  // 平移坐标原点
  const geoXYZ: RectangularCoord = [
    bodyXYZ[0] - earthXYZ[0],
    bodyXYZ[1] - earthXYZ[1],
    bodyXYZ[2] - earthXYZ[2],
  ];

  return rectangularToSpherical(geoXYZ);
}

/**
 * 计算视差角 (不是视差)
 * @see eph0.js:209-212 shiChaJ函数
 *
 * @param gst - 格林尼治恒星时 (弧度)
 * @param longitude - 观测点经度 (弧度)
 * @param latitude - 观测点纬度 (弧度)
 * @param ra - 天体赤经 (弧度)
 * @param dec - 天体赤纬 (弧度)
 * @returns 视差角 (弧度)
 */
export function parallacticAngle(
  gst: number,
  longitude: number,
  latitude: number,
  ra: number,
  dec: number
): number {
  const hourAngle = gst + longitude - ra; // 天体的时角
  return normalizeAngle(Math.atan2(Math.sin(hourAngle), Math.tan(latitude) * Math.cos(dec) - Math.sin(dec) * Math.cos(hourAngle)));
}
