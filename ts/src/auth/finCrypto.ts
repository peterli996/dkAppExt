// FIN SCRAM-SHA-256 认证用到的最小加密原语。
// 直接照抄 FIN 原生登录页（hxUser pod 内 res/login.js）里手写的 rstr-based SHA-256/HMAC/PBKDF2 实现，
// 保证跟服务端握手时的字节级编码完全一致——不用 crypto-js，避免不同库间的编码语义差异导致握手失败。

const B64_TAB =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** 生成指定长度的随机 nonce（字符取自 base64 字母表，仅用作握手新鲜度，不要求密码学安全） */
export function nonce(len: number): string {
	let text = ''
	for (let i = 0; i < len; i++) {
		text += B64_TAB.charAt(Math.floor(Math.random() * B64_TAB.length))
	}
	return text
}

/** 把字符串按 UTF-8 编码后转成"每个字符一个字节"的 raw string */
export function str2rstrUtf8(input: string): string {
	const bytes = new TextEncoder().encode(input)
	let out = ''
	for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
	return out
}

/** raw string -> 标准 base64（带 padding） */
export function rstr2b64(input: string): string {
	let output = ''
	const len = input.length
	for (let i = 0; i < len; i += 3) {
		const triplet =
			(input.charCodeAt(i) << 16) |
			(i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) |
			(i + 2 < len ? input.charCodeAt(i + 2) : 0)
		for (let j = 0; j < 4; j++) {
			if (i * 8 + j * 6 > len * 8) output += '='
			else output += B64_TAB.charAt((triplet >>> (6 * (3 - j))) & 0x3f)
		}
	}
	return output
}

/** raw string -> base64url（无 padding） */
export function rstr2b64uri(input: string): string {
	return rstr2b64(input)
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
}

/** raw string -> hex（仅测试用） */
export function rstr2hex(input: string): string {
	const hexTab = '0123456789abcdef'
	let output = ''
	for (let i = 0; i < input.length; i++) {
		const x = input.charCodeAt(i)
		output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
	}
	return output
}

/** 两个等长 raw string 按字节异或 */
export function xor(a: string, b: string): string {
	if (a.length !== b.length) throw new Error('xor: length mismatch')
	let out = ''
	for (let i = 0; i < a.length; i++) {
		out += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i))
	}
	return out
}

// ---- SHA-256（rstr 输入输出，big-endian word 运算，照抄自 login.js） ----

function safeAdd(x: number, y: number): number {
	const lsw = (x & 0xffff) + (y & 0xffff)
	const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
	return (msw << 16) | (lsw & 0xffff)
}

function rstr2binb(input: string): number[] {
	const output = new Array<number>(Math.ceil(input.length / 4) + 1).fill(0)
	for (let i = 0; i < input.length * 8; i += 8) {
		output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (24 - (i % 32))
	}
	return output
}

function binb2rstr(input: number[]): string {
	let output = ''
	for (let i = 0; i < input.length * 32; i += 8) {
		output += String.fromCharCode(
			(input[i >> 5] >>> (24 - (i % 32))) & 0xff
		)
	}
	return output
}

const SHA256_K = [
	1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
	-1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
	1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
	264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
	-1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
	113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
	1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
	-1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
	430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
	1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
	-1866530822, -1538233109, -1090935817, -965641998,
]

function s(x: number, n: number): number {
	return (x >>> n) | (x << (32 - n))
}
function r(x: number, n: number): number {
	return x >>> n
}
function ch(x: number, y: number, z: number): number {
	return (x & y) ^ (~x & z)
}
function maj(x: number, y: number, z: number): number {
	return (x & y) ^ (x & z) ^ (y & z)
}
function sigma0(x: number): number {
	return s(x, 2) ^ s(x, 13) ^ s(x, 22)
}
function sigma1(x: number): number {
	return s(x, 6) ^ s(x, 11) ^ s(x, 25)
}
function gamma0(x: number): number {
	return s(x, 7) ^ s(x, 18) ^ r(x, 3)
}
function gamma1(x: number): number {
	return s(x, 17) ^ s(x, 19) ^ r(x, 10)
}

function binbSha256(m: number[], l: number): number[] {
	const hash = [
		1779033703, -1150833019, 1013904242, -1521486534, 1359893119,
		-1694144372, 528734635, 1541459225,
	]
	const w = new Array<number>(64).fill(0)
	const msg = m.slice()

	msg[l >> 5] |= 0x80 << (24 - (l % 32))
	msg[(((l + 64) >> 9) << 4) + 15] = l

	for (let i = 0; i < msg.length; i += 16) {
		let a = hash[0]
		let b = hash[1]
		let c = hash[2]
		let d = hash[3]
		let e = hash[4]
		let f = hash[5]
		let g = hash[6]
		let h = hash[7]

		for (let j = 0; j < 64; j++) {
			if (j < 16) w[j] = msg[j + i] ?? 0
			else
				w[j] = safeAdd(
					safeAdd(
						safeAdd(gamma1(w[j - 2]), w[j - 7]),
						gamma0(w[j - 15])
					),
					w[j - 16]
				)

			const t1 = safeAdd(
				safeAdd(
					safeAdd(safeAdd(h, sigma1(e)), ch(e, f, g)),
					SHA256_K[j]
				),
				w[j]
			)
			const t2 = safeAdd(sigma0(a), maj(a, b, c))
			h = g
			g = f
			f = e
			e = safeAdd(d, t1)
			d = c
			c = b
			b = a
			a = safeAdd(t1, t2)
		}

		hash[0] = safeAdd(a, hash[0])
		hash[1] = safeAdd(b, hash[1])
		hash[2] = safeAdd(c, hash[2])
		hash[3] = safeAdd(d, hash[3])
		hash[4] = safeAdd(e, hash[4])
		hash[5] = safeAdd(f, hash[5])
		hash[6] = safeAdd(g, hash[6])
		hash[7] = safeAdd(h, hash[7])
	}
	return hash
}

function rstrHmacSha256(key: string, data: string): string {
	let bkey = rstr2binb(key)
	if (bkey.length > 16) bkey = binbSha256(bkey, key.length * 8)

	const ipad = new Array<number>(16).fill(0)
	const opad = new Array<number>(16).fill(0)
	for (let i = 0; i < 16; i++) {
		ipad[i] = (bkey[i] ?? 0) ^ 0x36363636
		opad[i] = (bkey[i] ?? 0) ^ 0x5c5c5c5c
	}

	const inner = binbSha256(
		ipad.concat(rstr2binb(data)),
		512 + data.length * 8
	)
	return binb2rstr(binbSha256(opad.concat(inner), 512 + 256))
}

/** SHA-256(data)，输入输出均为 raw string */
export function sha256(data: string): string {
	return binb2rstr(binbSha256(rstr2binb(data), data.length * 8))
}

/** HMAC-SHA-256(key, data)，输入输出均为 raw string */
export function hmacSha256(key: string, data: string): string {
	return rstrHmacSha256(key, data)
}

/** PBKDF2-HMAC-SHA256，password/salt 为 raw string，返回 dkLen 字节的 raw string 派生密钥 */
export function pbkdf2HmacSha256(
	password: string,
	salt: string,
	iterations: number,
	dkLen: number
): string {
	const hLen = 32
	const l = Math.ceil(dkLen / hLen)
	let t = ''

	for (let i = 1; i <= l; i++) {
		const blockIndex = binb2rstr([i])
		let uPrev = rstrHmacSha256(password, salt + blockIndex)
		let uXor = uPrev
		for (let iter = 1; iter < iterations; iter++) {
			uPrev = rstrHmacSha256(password, uPrev)
			uXor = xor(uXor, uPrev)
		}
		t += uXor
	}

	return t.substring(0, dkLen)
}
