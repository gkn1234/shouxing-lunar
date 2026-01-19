/**
 * 晨昏蒙影计算
 *
 * 来源：寿星万年历
 *
 * 晨昏蒙影是太阳在地平线下时，大气散射产生的光照现象
 *
 * 三种晨昏光定义：
 * - 民用晨昏光 (Civil Twilight)：太阳中心在地平线下 6°
 *   地面上有足够的自然光线进行户外活动，不需要人工照明
 *
 * - 航海晨昏光 (Nautical Twilight)：太阳中心在地平线下 12°
 *   地平线仍可辨认，航海时可以确定船只方位
 *
 * - 天文晨昏光 (Astronomical Twilight)：太阳中心在地平线下 18°
 *   天空完全黑暗，可以进行天文观测
 *
 * 术语说明：
 * - 晨光始 (Dawn)：黎明开始，太阳升到指定角度
 * - 昏影终 (Dusk)：黄昏结束，太阳降到指定角度以下
 */

import { calculateSunRiseTransitSet, HorizonType, RiseTransitSetResult } from './rise-transit-set';

/**
 * 晨昏光类型（重新导出以方便使用）
 * 与 HorizonType 相同，但排除 Standard 类型
 */
export { HorizonType as TwilightType };

/**
 * 晨昏光时刻
 */
export interface TwilightTimes {
  /** 晨光始（黎明开始） - Dawn */
  dawn: number | null;
  /** 昏影终（黄昏结束） - Dusk */
  dusk: number | null;
}

/**
 * 从升中天落结果提取晨昏光时刻
 *
 * @param result - 升中天落计算结果
 * @returns 晨昏光时刻
 */
function extractTwilightTimes(result: RiseTransitSetResult): TwilightTimes {
  // 如果是极昼或极夜，则没有晨昏光
  if (result.alwaysDown || result.alwaysUp) {
    return {
      dawn: null,
      dusk: null,
    };
  }

  return {
    dawn: result.rise,
    dusk: result.set,
  };
}

/**
 * 计算晨昏光时刻
 *
 * 根据指定的晨昏光类型，计算太阳到达对应高度角的时刻。
 *
 * @param jd - 儒略日 (J2000起算)
 * @param longitude - 观测点经度（弧度，东正西负）
 * @param latitude - 观测点纬度（弧度）
 * @param type - 晨昏光类型，默认为民用晨昏光
 * @returns 晨光始和昏影终时刻（儒略日），极昼或极夜时返回 null
 *
 * @example
 * ```typescript
 * // 计算北京 2024年6月21日的民用晨昏光
 * const jd = 2460483.5 - 2451545; // J2000起算
 * const longitude = 116.4 * Math.PI / 180; // 东经116.4度
 * const latitude = 39.9 * Math.PI / 180;   // 北纬39.9度
 *
 * const times = calculateTwilight(jd, longitude, latitude, HorizonType.Civil);
 * console.log('黎明:', times.dawn);
 * console.log('黄昏:', times.dusk);
 * ```
 */
export function calculateTwilight(
  jd: number,
  longitude: number,
  latitude: number,
  type: HorizonType = HorizonType.Civil
): TwilightTimes {
  const result = calculateSunRiseTransitSet(jd, longitude, latitude, type);
  return extractTwilightTimes(result);
}

/**
 * 计算民用晨昏光时刻
 *
 * 民用晨昏光：太阳中心在地平线下 6°
 * 此时地面上有足够的自然光线进行户外活动。
 *
 * @param jd - 儒略日 (J2000起算)
 * @param longitude - 观测点经度（弧度，东正西负）
 * @param latitude - 观测点纬度（弧度）
 * @returns 晨光始和昏影终时刻（儒略日）
 *
 * @example
 * ```typescript
 * const times = calculateCivilTwilight(jd, longitude, latitude);
 * if (times.dawn !== null) {
 *   console.log('民用黎明开始:', times.dawn);
 * }
 * ```
 */
export function calculateCivilTwilight(
  jd: number,
  longitude: number,
  latitude: number
): TwilightTimes {
  return calculateTwilight(jd, longitude, latitude, HorizonType.Civil);
}

/**
 * 计算航海晨昏光时刻
 *
 * 航海晨昏光：太阳中心在地平线下 12°
 * 此时地平线仍可辨认，航海时可以确定船只方位。
 *
 * @param jd - 儒略日 (J2000起算)
 * @param longitude - 观测点经度（弧度，东正西负）
 * @param latitude - 观测点纬度（弧度）
 * @returns 晨光始和昏影终时刻（儒略日）
 *
 * @example
 * ```typescript
 * const times = calculateNauticalTwilight(jd, longitude, latitude);
 * if (times.dawn !== null) {
 *   console.log('航海黎明开始:', times.dawn);
 * }
 * ```
 */
export function calculateNauticalTwilight(
  jd: number,
  longitude: number,
  latitude: number
): TwilightTimes {
  return calculateTwilight(jd, longitude, latitude, HorizonType.Nautical);
}

/**
 * 计算天文晨昏光时刻
 *
 * 天文晨昏光：太阳中心在地平线下 18°
 * 此时天空完全黑暗，可以进行天文观测。
 *
 * @param jd - 儒略日 (J2000起算)
 * @param longitude - 观测点经度（弧度，东正西负）
 * @param latitude - 观测点纬度（弧度）
 * @returns 晨光始和昏影终时刻（儒略日）
 *
 * @example
 * ```typescript
 * const times = calculateAstronomicalTwilight(jd, longitude, latitude);
 * if (times.dawn !== null) {
 *   console.log('天文黎明开始:', times.dawn);
 * }
 * ```
 */
export function calculateAstronomicalTwilight(
  jd: number,
  longitude: number,
  latitude: number
): TwilightTimes {
  return calculateTwilight(jd, longitude, latitude, HorizonType.Astronomical);
}
