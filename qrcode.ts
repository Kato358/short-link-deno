// Minimal QR Code generator (Versions 1-5, EC Level M)
// Generates SVG markup for embedding in HTML

const ALIGNED_POS: Record<number, number[]> = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
};

const VERSION_SPEC = {
  // [dataCodewords, ecPerBlock, nBlocks, g1DataPerBlock, g2DataPerBlock(0=no g2)]
  1: [16, 10, 1, 16, 0],
  2: [28, 16, 1, 28, 0],
  3: [44, 26, 1, 44, 0],
  4: [64, 18, 2, 32, 0],
  5: [86, 24, 2, 43, 0],
} as Record<number, number[]>;

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen: number[] = [1];
  for (let i = 0; i < ecLen; i++) {
    const ng = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      ng[j] ^= gen[j];
      ng[j + 1] ^= gfMul(gen[j], EXP[i]);
    }
    gen.length = 0;
    gen.push(...ng);
  }

  const msg = [...data, ...new Array(ecLen).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

function formatInfo(mask: number): number {
  const data = mask; // EC level M = 00
  let d = data << 10;
  for (let i = 4; i >= 0; i--) {
    if (d & (1 << (i + 10))) d ^= 0x537 << i;
  }
  return ((data << 10) | d) ^ 0x5412;
}

function chooseVersion(byteLen: number): number {
  for (let v = 1; v <= 5; v++) {
    const cap = VERSION_SPEC[v][0] - 2; // mode(4bits) + ccibits(8bits for v1-9) = ~2 bytes overhead
    if (byteLen <= cap) return v;
  }
  return -1;
}

function encodeData(text: string, version: number): number[] {
  const spec = VERSION_SPEC[version];
  const totalDataCW = spec[0];
  const bytes = new TextEncoder().encode(text);

  const bits: number[] = [];
  // Mode indicator: byte mode = 0100
  bits.push(0, 1, 0, 0);
  // Character count (8 bits for versions 1-9)
  for (let i = 7; i >= 0; i--) bits.push((bytes.length >> i) & 1);
  // Data bytes
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  // Terminator
  const maxBits = totalDataCW * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad codewords
  const pads = [0xEC, 0x11];
  let pi = 0;
  while (bits.length < maxBits) {
    for (let i = 7; i >= 0; i--) bits.push((pads[pi % 2] >> i) & 1);
    pi++;
  }

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
    codewords.push(byte);
  }
  return codewords;
}

function interleaveBlocks(dataCW: number[], version: number): number[] {
  const spec = VERSION_SPEC[version];
  const ecPerBlock = spec[1];
  const nBlocks = spec[2];
  const g1Data = spec[3];
  const g2Data = spec[4];
  const g1Count = g2Data > 0 ? nBlocks - 1 : nBlocks;
  const g2Count = g2Data > 0 ? 1 : 0;

  const blocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < g1Count; i++) {
    blocks.push(dataCW.slice(offset, offset + g1Data));
    offset += g1Data;
  }
  for (let i = 0; i < g2Count; i++) {
    blocks.push(dataCW.slice(offset, offset + g2Data));
    offset += g2Data;
  }

  const ecBlocks: number[][] = blocks.map((b) => rsEncode(b, ecPerBlock));

  const result: number[] = [];
  const maxDataLen = Math.max(g1Data, g2Data || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of blocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const ec of ecBlocks) {
      result.push(ec[i]);
    }
  }
  return result;
}

function createMatrix(
  version: number,
): { matrix: number[][]; reserved: boolean[][] } {
  const size = 4 * version + 17;
  const matrix: number[][] = Array.from(
    { length: size },
    () => new Array(size).fill(0),
  );
  const reserved: boolean[][] = Array.from(
    { length: size },
    () => new Array(size).fill(false),
  );

  function setModule(r: number, c: number, val: number) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      reserved[r][c] = true;
    }
  }

  // Finder patterns
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;
        const inOuter = r === -1 || r === 7 || c === -1 || c === 7;
        const inBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setModule(mr, mc, inOuter ? 0 : (inBorder || inInner ? 1 : 0));
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0;
    if (!reserved[6][i]) setModule(6, i, val);
    if (!reserved[i][6]) setModule(i, 6, val);
  }

  // Alignment patterns
  if (version >= 2) {
    const pos = ALIGNED_POS[version] || [];
    for (const row of pos) {
      for (const col of pos) {
        if (row <= 8 && col <= 8) continue;
        if (row <= 8 && col >= size - 9) continue;
        if (row >= size - 9 && col <= 8) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const val =
              (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0))
                ? 1
                : 0;
            setModule(row + r, col + c, val);
          }
        }
      }
    }
  }

  // Dark module
  setModule(size - 8, 8, 1);

  // Reserve format info positions (values filled after mask selection)
  for (let i = 0; i <= 8; i++) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i <= 7; i++) {
    if (!reserved[8][size - 1 - i]) reserved[8][size - 1 - i] = true;
    if (!reserved[size - 1 - i][8]) reserved[size - 1 - i][8] = true;
  }

  return { matrix, reserved };
}

function placeData(
  matrix: number[][],
  reserved: boolean[][],
  data: number[],
): void {
  const size = matrix.length;
  const bits: number[] = [];
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }

  let bitIdx = 0;
  let col = size - 1;
  let upward = true;

  while (col > 0) {
    if (col === 6) col--;
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (let dc = 0; dc <= 1; dc++) {
        const c = col - dc;
        if (c < 0 || reserved[row][c]) continue;
        matrix[row][c] = bitIdx < bits.length ? bits[bitIdx++] : 0;
      }
    }
    upward = !upward;
    col -= 2;
  }
}

function applyMask(
  matrix: number[][],
  reserved: boolean[][],
  mask: number,
): number[][] {
  const size = matrix.length;
  const result = matrix.map((row) => [...row]);

  const maskFns: Array<(r: number, c: number) => boolean> = [
    (r, c) => (r + c) % 2 === 0,
    (r, _c) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      if (maskFns[mask](r, c)) {
        result[r][c] ^= 1;
      }
    }
  }
  return result;
}

function writeFormatInfo(matrix: number[][], mask: number): void {
  const size = matrix.length;
  const fmt = formatInfo(mask);

  // First copy: around top-left finder
  const hPos = [0, 1, 2, 3, 4, 5, 7, 8];
  for (let i = 0; i < 8; i++) {
    matrix[8][hPos[i]] = (fmt >> (14 - i)) & 1;
  }
  const vPos = [7, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < 7; i++) {
    matrix[vPos[i]][8] = (fmt >> (14 - 8 - i)) & 1;
  }

  // Second copy: bottom-left column + top-right row
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = (fmt >> (14 - i)) & 1;
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = (fmt >> (6 - i)) & 1;
  }
}

function penaltyScore(matrix: number[][]): number {
  const size = matrix.length;
  let score = 0;

  // Rule 1: 5+ consecutive same-color modules in row/col
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) run++;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) run++;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (
        v === matrix[r][c + 1] && v === matrix[r + 1][c] &&
        v === matrix[r + 1][c + 1]
      ) {
        score += 3;
      }
    }
  }

  return score;
}

function matrixToSvg(
  matrix: number[][],
  moduleSize: number,
  quietZone: number,
): string {
  const size = matrix.length;
  const totalSize = size * moduleSize + quietZone * 2;
  const rects: string[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        rects.push(
          `<rect x="${quietZone + c * moduleSize}" y="${
            quietZone + r * moduleSize
          }" width="${moduleSize}" height="${moduleSize}"/>`,
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="200" height="200"><rect width="${totalSize}" height="${totalSize}" fill="white"/><g fill="black">${
    rects.join("")
  }</g></svg>`;
}

export function generateQR(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  if (version < 0) return "";

  const dataCW = encodeData(text, version);
  const interleaved = interleaveBlocks(dataCW, version);
  const { matrix, reserved } = createMatrix(version);
  placeData(matrix, reserved, interleaved);

  let bestMask = 0;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(matrix, reserved, mask);
    writeFormatInfo(masked, mask);
    const score = penaltyScore(masked);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
  }

  // Re-apply best mask (writeFormatInfo modifies in place, but we need a clean one)
  const finalMatrix = applyMask(matrix, reserved, bestMask);
  writeFormatInfo(finalMatrix, bestMask);

  return matrixToSvg(finalMatrix, 4, 16);
}
