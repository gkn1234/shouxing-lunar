/**
 * VSOP87 行星星历数据及月球、冥王星数据
 *
 * 来源：寿星万年历 eph0.js
 *
 * 包含内容：
 * - VSOP87 八大行星数据（水、金、地、火、木、土、天王、海王）
 * - 冥王星数据（独立算法）
 * - 月球数据（独立算法）
 */

// 地球
export {
  EARTH_MULTIPLIER,
  EARTH_INDEX,
  EARTH_L,
  EARTH_B,
  EARTH_R,
} from './earth';

// 水星
export {
  MERCURY_MULTIPLIER,
  MERCURY_INDEX,
  MERCURY_L,
  MERCURY_B,
  MERCURY_R,
} from './mercury';

// 金星
export {
  VENUS_MULTIPLIER,
  VENUS_INDEX,
  VENUS_L,
  VENUS_B,
  VENUS_R,
} from './venus';

// 火星
export {
  MARS_MULTIPLIER,
  MARS_INDEX,
  MARS_L,
  MARS_B,
  MARS_R,
} from './mars';

// 木星
export {
  JUPITER_MULTIPLIER,
  JUPITER_INDEX,
  JUPITER_L,
  JUPITER_B,
  JUPITER_R,
} from './jupiter';

// 土星
export {
  SATURN_MULTIPLIER,
  SATURN_INDEX,
  SATURN_L,
  SATURN_B,
  SATURN_R,
} from './saturn';

// 天王星
export {
  URANUS_MULTIPLIER,
  URANUS_INDEX,
  URANUS_L,
  URANUS_B,
  URANUS_R,
} from './uranus';

// 海王星
export {
  NEPTUNE_MULTIPLIER,
  NEPTUNE_INDEX,
  NEPTUNE_L,
  NEPTUNE_B,
  NEPTUNE_R,
} from './neptune';

// 冥王星 (独立算法，非VSOP87)
export {
  PLUTO_MULTIPLIER,
  PLUTO_OFFSET,
  PLUTO_X,
  PLUTO_Y,
  PLUTO_Z,
  PLUTO_DATA,
} from './pluto';

// 月球 (独立算法)
export { MOON_L, MOON_B, MOON_R } from './moon';
