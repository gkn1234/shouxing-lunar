/**
 * 实朔实气计算 - SSQ (Shuo-Qi Calculator)
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:396-679 SSQ对象
 *
 * 这是农历计算的核心模块，用于精确计算：
 * - 定朔：日月合朔时刻（农历月首）
 * - 定气：太阳到达黄经整数倍15°的时刻（节气）
 */

import { PI2 } from '../core/constants';
import { J2000 } from '../core/constants';
import { calcDeltaT } from '../core/delta-t';
import {
  calculateTimeFromSunLongitude,
} from '../ephemeris/sun';
import {
  calculateTimeFromMoonSunDiff,
  calculateTimeFromMoonSunDiffFast,
} from '../ephemeris/moon';

/**
 * 朔直线拟合参数表
 * @see lunar.js:400-415 suoKB数组
 *
 * 格式：[起始儒略日, 朔望月长度, ...]
 * 用于历史时期（-721至619年）的平朔计算
 */
export const SHUO_KB: readonly number[] = [
  1457698.231017, 29.53067166, // -721-12-17 古历·春秋
  1546082.512234, 29.53085106, // -479-12-11 古历·战国
  1640640.7353, 29.5306, // -221-10-31 古历·秦汉
  1642472.151543, 29.53085439, // -216-11-04 古历·秦汉
  1683430.5093, 29.53086148, // -104-12-25 汉书·律历志(太初历)
  1752148.041079, 29.53085097, // 85-02-13 后汉书·律历志(四分历)
  1807724.48152, 29.53059851, // 237-04-12 晋书·律历志(景初历)
  1883618.1141, 29.5306, // 445-01-24 宋书·律历志(元嘉历)
  1907360.7047, 29.5306, // 510-01-26 宋书·律历志(大明历)
  1936596.2249, 29.5306, // 590-02-10 随书·律历志(开皇历)
  1939135.6753, 29.5306, // 597-01-24 随书·律历志(大业历)
  1947168.0, // 619-01-21 结束标记
] as const;

/**
 * 气直线拟合参数表
 * @see lunar.js:417-455 qiKB数组
 *
 * 格式：[起始儒略日, 节气间隔天数, ...]
 * 用于历史时期的平气计算
 */
export const QI_KB: readonly number[] = [
  1640650.479938, 15.218425, // -221-11-09 古历·秦汉
  1642476.703182, 15.21874996, // -216-11-09 古历·秦汉
  1683430.515601, 15.218750011, // -104-12-25 汉书·律历志(太初历)
  1752157.640664, 15.218749978, // 85-02-23 后汉书·律历志(四分历)
  1807675.003759, 15.218620279, // 237-02-22 晋书·律历志(景初历)
  1883627.765182, 15.218612292, // 445-02-03 宋书·律历志(元嘉历)
  1907369.1281, 15.218449176, // 510-02-03 宋书·律历志(大明历)
  1936603.140413, 15.218425, // 590-02-17 随书·律历志(开皇历)
  1939145.52418, 15.218466998, // 597-02-03 随书·律历志(大业历)
  1947180.7983, 15.218524844, // 619-02-03 新唐书·历志(戊寅元历)
  1964362.041824, 15.218533526, // 666-02-17 新唐书·历志(麟德历)
  1987372.340971, 15.218513908, // 729-02-16 新唐书·历志(大衍历)
  1999653.819126, 15.218530782, // 762-10-03 新唐书·历志(五纪历)
  2007445.469786, 15.218535181, // 784-02-01 新唐书·历志(正元历)
  2021324.917146, 15.218526248, // 822-02-01 新唐书·历志(宣明历)
  2047257.232342, 15.218519654, // 893-01-31 新唐书·历志(崇玄历)
  2070282.898213, 15.218425, // 956-02-16 旧五代·历志(钦天历)
  2073204.87285, 15.218515221, // 964-02-16 宋史·律历志(应天历)
  2080144.500926, 15.218530782, // 983-02-16 宋史·律历志(乾元历)
  2086703.688963, 15.218523776, // 1001-01-31 宋史·律历志(仪天历)
  2110033.182763, 15.218425, // 1064-12-15 宋史·律历志(明天历)
  2111190.300888, 15.218425, // 1068-02-15 宋史·律历志(崇天历)
  2113731.271005, 15.218515671, // 1075-01-30 李锐补修(奉元历)
  2120670.840263, 15.218425, // 1094-01-30 宋史·律历志
  2123973.309063, 15.218425, // 1103-02-14 李锐补修(占天历)
  2125068.997336, 15.218477932, // 1106-02-14 宋史·律历志(纪元历)
  2136026.312633, 15.218472436, // 1136-02-14 宋史·律历志(统元历)
  2156099.495538, 15.218425, // 1191-01-29 宋史·律历志(会元历)
  2159021.324663, 15.218425, // 1199-01-29 宋史·律历志(统天历)
  2162308.575254, 15.218461742, // 1208-01-30 宋史·律历志(开禧历)
  2178485.706538, 15.218425, // 1252-05-15 淳祐历
  2178759.662849, 15.218445786, // 1253-02-13 会天历
  2185334.0208, 15.218425, // 1271-02-13 宋史·律历志(成天历)
  2187525.481425, 15.218425, // 1277-02-12 本天历
  2188621.191481, 15.218437494, // 1280-02-13 元史·历志(授时历)
  2322147.76, // 1645-09-21 结束标记
] as const;

/**
 * 定朔修正表（压缩格式）
 * @see lunar.js:532-552 suoS字符串
 *
 * 619-01-21开始16598个朔日修正表
 * 修正值：0=不修正，1=+1天，2=-1天
 */
const SHUO_COMPRESSED =
  'EqoFscDcrFpmEsF2DfFideFelFpFfFfFiaipqti1ksttikptikqckstekqttgkqttgkqteksttikptikq2fjstgjqttjkqttgkqt' +
  'ekstfkptikq2tijstgjiFkirFsAeACoFsiDaDiADc1AFbBfgdfikijFifegF1FhaikgFag1E2btaieeibggiffdeigFfqDfaiBkF' +
  '1kEaikhkigeidhhdiegcFfakF1ggkidbiaedksaFffckekidhhdhdikcikiakicjF1deedFhFccgicdekgiFbiaikcfi1kbFibef' +
  'gEgFdcFkFeFkdcfkF1kfkcickEiFkDacFiEfbiaejcFfffkhkdgkaiei1ehigikhdFikfckF1dhhdikcfgjikhfjicjicgiehdik' +
  'cikggcifgiejF1jkieFhegikggcikFegiegkfjebhigikggcikdgkaFkijcfkcikfkcifikiggkaeeigefkcdfcfkhkdgkegieid' +
  'hijcFfakhfgeidieidiegikhfkfckfcjbdehdikggikgkfkicjicjF1dbidikFiggcifgiejkiegkigcdiegfggcikdbgfgefjF1' +
  'kfegikggcikdgFkeeijcfkcikfkekcikdgkabhkFikaffcfkhkdgkegbiaekfkiakicjhfgqdq2fkiakgkfkhfkfcjiekgFebicg' +
  'gbedF1jikejbbbiakgbgkacgiejkijjgigfiakggfggcibFifjefjF1kfekdgjcibFeFkijcfkfhkfkeaieigekgbhkfikidfcje' +
  'aibgekgdkiffiffkiakF1jhbakgdki1dj1ikfkicjicjieeFkgdkicggkighdF1jfgkgfgbdkicggfggkidFkiekgijkeigfiski' +
  'ggfaidheigF1jekijcikickiggkidhhdbgcfkFikikhkigeidieFikggikhkffaffijhidhhakgdkhkijF1kiakF1kfheakgdkif' +
  'iggkigicjiejkieedikgdfcggkigieeiejfgkgkigbgikicggkiaideeijkefjeijikhkiggkiaidheigcikaikffikijgkiahi1' +
  'hhdikgjfifaakekighie1hiaikggikhkffakicjhiahaikggikhkijF1kfejfeFhidikggiffiggkigicjiekgieeigikggiffig' +
  'gkidheigkgfjkeigiegikifiggkidhedeijcfkFikikhkiggkidhh1ehigcikaffkhkiggkidhh1hhigikekfiFkFikcidhh1hit' +
  'cikggikhkfkicjicghiediaikggikhkijbjfejfeFhaikggifikiggkigiejkikgkgieeigikggiffiggkigieeigekijcijikgg' +
  'ifikiggkideedeijkefkfckikhkiggkidhh1ehijcikaffkhkiggkidhh1hhigikhkikFikfckcidhh1hiaikgjikhfjicjicgie' +
  'hdikcikggifikigiejfejkieFhegikggifikiggfghigkfjeijkhigikggifikiggkigieeijcijcikfksikifikiggkidehdeij' +
  'cfdckikhkiggkhghh1ehijikifffffkhsFngErD1pAfBoDd1BlEtFqA2AqoEpDqElAEsEeB2BmADlDkqBtC1FnEpDqnEmFsFsAFn' +
  'llBbFmDsDiCtDmAB2BmtCgpEplCpAEiBiEoFqFtEqsDcCnFtADnFlEgdkEgmEtEsCtDmADqFtAFrAtEcCqAE1BoFqC1F1DrFtBmF' +
  'tAC2ACnFaoCgADcADcCcFfoFtDlAFgmFqBq2bpEoAEmkqnEeCtAE1bAEqgDfFfCrgEcBrACfAAABqAAB1AAClEnFeCtCgAADqDoB' +
  'mtAAACbFiAAADsEtBqAB2FsDqpFqEmFsCeDtFlCeDtoEpClEqAAFrAFoCgFmFsFqEnAEcCqFeCtFtEnAEeFtAAEkFnErAABbFkAD' +
  'nAAeCtFeAfBoAEpFtAABtFqAApDcCGJ';

/**
 * 定气修正表（压缩格式）
 * @see lunar.js:555-559 qiS字符串
 *
 * 1645-09-23开始7567个节气修正表
 */
const QI_COMPRESSED =
  'FrcFs22AFsckF2tsDtFqEtF1posFdFgiFseFtmelpsEfhkF2anmelpFlF1ikrotcnEqEq2FfqmcDsrFor22FgFrcgDscFs22FgEe' +
  'FtE2sfFs22sCoEsaF2tsD1FpeE2eFsssEciFsFnmelpFcFhkF2tcnEqEpFgkrotcnEqrEtFermcDsrE222FgBmcmr22DaEfnaF22' +
  '2sD1FpeForeF2tssEfiFpEoeFssD1iFstEqFppDgFstcnEqEpFg11FscnEqrAoAF2ClAEsDmDtCtBaDlAFbAEpAAAAAD2FgBiBqo' +
  'BbnBaBoAAAAAAAEgDqAdBqAFrBaBoACdAAf1AACgAAAeBbCamDgEifAE2AABa1C1BgFdiAAACoCeE1ADiEifDaAEqAAFe1AcFbcA' +
  'AAAAF1iFaAAACpACmFmAAAAAAAACrDaAAADG0';

/**
 * 解压缩气朔修正表
 * @see lunar.js:495-527 jieya函数
 *
 * @param compressed - 压缩字符串
 * @returns 解压后的修正表字符串
 */
function decompressCorrectionTable(compressed: string): string {
  const o = '0000000000';
  const o2 = o + o;

  let s = compressed;
  s = s.replace(/J/g, '00');
  s = s.replace(/I/g, '000');
  s = s.replace(/H/g, '0000');
  s = s.replace(/G/g, '00000');
  s = s.replace(/t/g, '02');
  s = s.replace(/s/g, '002');
  s = s.replace(/r/g, '0002');
  s = s.replace(/q/g, '00002');
  s = s.replace(/p/g, '000002');
  s = s.replace(/o/g, '0000002');
  s = s.replace(/n/g, '00000002');
  s = s.replace(/m/g, '000000002');
  s = s.replace(/l/g, '0000000002');
  s = s.replace(/k/g, '01');
  s = s.replace(/j/g, '0101');
  s = s.replace(/i/g, '001');
  s = s.replace(/h/g, '001001');
  s = s.replace(/g/g, '0001');
  s = s.replace(/f/g, '00001');
  s = s.replace(/e/g, '000001');
  s = s.replace(/d/g, '0000001');
  s = s.replace(/c/g, '00000001');
  s = s.replace(/b/g, '000000001');
  s = s.replace(/a/g, '0000000001');
  s = s.replace(/A/g, o2 + o2 + o2);
  s = s.replace(/B/g, o2 + o2 + o);
  s = s.replace(/C/g, o2 + o2);
  s = s.replace(/D/g, o2 + o);
  s = s.replace(/E/g, o2);
  s = s.replace(/F/g, o);

  return s;
}

// 解压后的修正表（延迟初始化）
let shuoCorrectionTable: string | null = null;
let qiCorrectionTable: string | null = null;

/**
 * 获取定朔修正表
 */
function getShuoCorrectionTable(): string {
  if (shuoCorrectionTable === null) {
    shuoCorrectionTable = decompressCorrectionTable(SHUO_COMPRESSED);
  }
  return shuoCorrectionTable;
}

/**
 * 获取定气修正表
 */
function getQiCorrectionTable(): string {
  if (qiCorrectionTable === null) {
    qiCorrectionTable = decompressCorrectionTable(QI_COMPRESSED);
  }
  return qiCorrectionTable;
}

/**
 * 低精度定朔计算
 * @see lunar.js:456-465 so_low函数
 *
 * 在2000年至公元前600年范围内，误差在2小时以内
 *
 * @param targetDiff - 目标日月黄经差 (弧度)
 * @returns 朔日儒略日 (J2000起算，北京时间)
 */
export function calculateShuoLow(targetDiff: number): number {
  const v = 7771.37714500204;
  let t = (targetDiff + 1.08472) / v;

  t -=
    (-0.0000331 * t * t +
      0.10976 * Math.cos(0.785 + 8328.6914 * t) +
      0.02224 * Math.cos(0.187 + 7214.0629 * t) -
      0.03342 * Math.cos(4.669 + 628.3076 * t)) /
      v +
    (32 * (t + 1.8) * (t + 1.8) - 20) / 86400 / 36525;

  return t * 36525 + 8 / 24; // 转为北京时间
}

/**
 * 低精度定气计算
 * @see lunar.js:466-479 qi_low函数
 *
 * 最大误差小于30分钟，平均5分钟
 *
 * @param targetLon - 目标太阳黄经 (弧度)
 * @returns 节气儒略日 (J2000起算，北京时间)
 */
export function calculateQiLow(targetLon: number): number {
  const v = 628.3319653318;

  // 第一次估算，误差2天以内
  let t = (targetLon - 4.895062166) / v;

  // 第二次估算，误差2小时以内
  t -=
    (53 * t * t +
      334116 * Math.cos(4.67 + 628.307585 * t) +
      2061 * Math.cos(2.678 + 628.3076 * t) * t) /
    v /
    10000000;

  // 平黄经计算
  const L =
    48950621.66 +
    6283319653.318 * t +
    53 * t * t +
    334166 * Math.cos(4.669257 + 628.307585 * t) +
    3489 * Math.cos(4.6261 + 1256.61517 * t) +
    2060.6 * Math.cos(2.67823 + 628.307585 * t) * t -
    994 -
    834 * Math.sin(2.1824 - 33.75705 * t);

  t -= (L / 10000000 - targetLon) / 628.332 + (32 * (t + 1.8) * (t + 1.8) - 20) / 86400 / 36525;

  return t * 36525 + 8 / 24; // 转为北京时间
}

/**
 * 高精度定气计算
 * @see lunar.js:480-486 qi_high函数
 *
 * @param targetLon - 目标太阳黄经 (弧度)
 * @returns 节气儒略日 (J2000起算，北京时间)
 */
export function calculateQiHigh(targetLon: number): number {
  // 使用高精度太阳黄经反求时间
  let t = calculateTimeFromSunLongitude(targetLon) * 36525;

  // ΔT修正，转为北京时间
  const deltaT = calcDeltaT(t) / 86400;
  t = t - deltaT + 8 / 24;

  // 如果接近午夜，使用更高精度计算
  const v = ((t + 0.5) % 1) * 86400;
  if (v < 1200 || v > 86400 - 1200) {
    t = calculateTimeFromSunLongitude(targetLon) * 36525 - deltaT + 8 / 24;
  }

  return t;
}

/**
 * 高精度定朔计算
 * @see lunar.js:487-493 so_high函数
 *
 * @param targetDiff - 目标日月黄经差 (弧度)
 * @returns 朔日儒略日 (J2000起算，北京时间)
 */
export function calculateShuoHigh(targetDiff: number): number {
  // 使用快速版本初步估算
  let t = calculateTimeFromMoonSunDiffFast(targetDiff) * 36525;

  // ΔT修正，转为北京时间
  const deltaT = calcDeltaT(t) / 86400;
  t = t - deltaT + 8 / 24;

  // 如果接近午夜，使用高精度计算
  const v = ((t + 0.5) % 1) * 86400;
  if (v < 1800 || v > 86400 - 1800) {
    t = calculateTimeFromMoonSunDiff(targetDiff) * 36525 - deltaT + 8 / 24;
  }

  return t;
}

/**
 * 计算朔日或节气
 * @see lunar.js:566-597 SSQ.calc函数
 *
 * 根据给定日期计算最近的朔日或节气
 * 支持从公元前721年至公元9999年的计算
 *
 * @param jd - 参考日期儒略日 (J2000起算)
 * @param type - 计算类型：'shuo'定朔，'qi'定气
 * @returns 朔日或节气的儒略日 (J2000起算)
 */
export function calculateShuoQi(jd: number, type: 'shuo' | 'qi'): number {
  const jdAbs = jd + J2000; // 转为绝对儒略日

  const isQi = type === 'qi';
  const KB = isQi ? QI_KB : SHUO_KB;
  const pc = isQi ? 7 : 14;

  const f1 = KB[0] - pc; // 平气朔表起始
  const f2 = KB[KB.length - 1] - pc; // 平气朔表结束
  const f3 = 2436935; // 1960.1.1

  // 1960年以后或平气朔表之前：使用现代天文算法
  if (jdAbs < f1 || jdAbs >= f3) {
    if (isQi) {
      // 定气计算
      // 2451259是1999.3.21春分
      const targetLon = Math.floor(((jdAbs + pc - 2451259) / 365.2422) * 24) * (Math.PI / 12);
      return Math.floor(calculateQiHigh(targetLon) + 0.5);
    } else {
      // 定朔计算
      // 2451551是2000.1.7朔日
      const targetDiff = Math.floor((jdAbs + pc - 2451551) / 29.5306) * PI2;
      return Math.floor(calculateShuoHigh(targetDiff) + 0.5);
    }
  }

  // 平气朔表范围内：使用历史参数
  if (jdAbs >= f1 && jdAbs < f2) {
    let i = 0;
    for (i = 0; i < KB.length; i += 2) {
      if (jdAbs + pc < KB[i + 2]) break;
    }

    let D = KB[i] + KB[i + 1] * Math.floor((jdAbs + pc - KB[i]) / KB[i + 1]);
    D = Math.floor(D + 0.5);

    // 太初历修正：-103年1月24日
    if (D === 1683460) D++;

    return D - J2000;
  }

  // 定气朔表范围内：使用低精度计算+修正表
  if (jdAbs >= f2 && jdAbs < f3) {
    let D: number;
    let n: string;

    if (isQi) {
      const targetLon = Math.floor(((jdAbs + pc - 2451259) / 365.2422) * 24) * (Math.PI / 12);
      D = Math.floor(calculateQiLow(targetLon) + 0.5);
      n = getQiCorrectionTable().charAt(Math.floor(((jdAbs - f2) / 365.2422) * 24));
    } else {
      const targetDiff = Math.floor((jdAbs + pc - 2451551) / 29.5306) * PI2;
      D = Math.floor(calculateShuoLow(targetDiff) + 0.5);
      n = getShuoCorrectionTable().charAt(Math.floor((jdAbs - f2) / 29.5306));
    }

    // 应用修正
    if (n === '1') return D + 1;
    if (n === '2') return D - 1;
    return D;
  }

  // 默认返回高精度计算
  if (isQi) {
    const targetLon = Math.floor(((jdAbs + pc - 2451259) / 365.2422) * 24) * (Math.PI / 12);
    return Math.floor(calculateQiHigh(targetLon) + 0.5);
  } else {
    const targetDiff = Math.floor((jdAbs + pc - 2451551) / 29.5306) * PI2;
    return Math.floor(calculateShuoHigh(targetDiff) + 0.5);
  }
}

/**
 * 二十四节气名称（从冬至开始）
 */
export const SOLAR_TERM_NAMES = [
  '冬至',
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
] as const;

/**
 * 月名称表（建寅为正月）
 */
export const LUNAR_MONTH_NAMES = [
  '十一',
  '十二',
  '正',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
] as const;

/**
 * 农历日名称表
 */
export const LUNAR_DAY_NAMES = [
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
] as const;

/**
 * 月相名称表
 */
export const MOON_PHASE_NAMES = ['朔', '上弦', '望', '下弦'] as const;
