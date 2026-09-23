// FIN 全局 SCRAM-SHA-256 登录握手（/user/auth）。
// 握手步骤、header 格式、各字段的编码方式（哪一层用 base64、哪一层用 base64url）严格对齐
// FIN 原生登录页的实现（hxUser pod 内 res/login.js 的 hxLogin.scram），保证跟服务端字节级兼容。
import {
	hmacSha256,
	nonce,
	pbkdf2HmacSha256,
	rstr2b64,
	rstr2b64uri,
	sha256,
	str2rstrUtf8,
	xor,
} from 'auth/finCrypto'

const AUTH_URI = '/user/auth'

interface AuthScheme {
	name: string
	params: Record<string, string>
}

function parseWwwAuthenticate(header: string): AuthScheme {
	const spaceIdx = header.indexOf(' ')
	const name = (
		spaceIdx === -1 ? header : header.slice(0, spaceIdx)
	).toLowerCase()
	const rest = spaceIdx === -1 ? '' : header.slice(spaceIdx + 1)
	const params: Record<string, string> = {}
	const re = /([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|([^,]*))/g
	let match: RegExpExecArray | null
	// eslint-disable-next-line no-cond-assign
	while ((match = re.exec(rest))) {
		const key = match[1].toLowerCase()
		const value = (match[2] !== undefined ? match[2] : match[3]).trim()
		params[key] = value
	}
	return { name, params }
}

function decodeMsgParams(msg: string): Record<string, string> {
	const data: Record<string, string> = {}
	msg.split(',').forEach((tok) => {
		const idx = tok.indexOf('=')
		if (idx > 0) data[tok.substring(0, idx)] = tok.substring(idx + 1)
	})
	return data
}

async function authReq(authorization: string): Promise<Response> {
	return fetch(AUTH_URI, {
		method: 'GET',
		credentials: 'same-origin',
		headers: { Authorization: authorization },
	})
}

function buildHeader(
	schemeName: string,
	data: string,
	handshakeToken?: string
): string {
	let header = `${schemeName} data=${data}`
	if (handshakeToken != null) header += `, handshakeToken=${handshakeToken}`
	return header
}

/**
 * 用用户名/密码走 SCRAM-SHA-256 完成登录，成功后浏览器已持有 FIN 的 session cookie。
 * 失败（用户名/密码错误、协议不匹配等）会 throw Error。
 */
export async function scramLogin(
	username: string,
	password: string
): Promise<void> {
	const u64 = rstr2b64uri(str2rstrUtf8(username))
	const helloRes = await authReq(`HELLO username=${u64}`)
	if (helloRes.status === 200) return // 已有有效 session（服务端 HELLO 短路）
	if (helloRes.status !== 401) {
		throw new Error(`登录失败（HELLO ${helloRes.status}）`)
	}

	const helloAuth = helloRes.headers.get('WWW-Authenticate')
	if (!helloAuth) throw new Error('登录失败：服务端未返回认证方式')
	const hello = parseWwwAuthenticate(helloAuth)
	if (hello.name !== 'scram')
		throw new Error(`不支持的认证方式：${hello.name}`)
	if ((hello.params['hash'] ?? '').toUpperCase() !== 'SHA-256') {
		throw new Error(`不支持的哈希算法：${hello.params['hash']}`)
	}

	const gs2Header = 'n,,'
	const cNonce = nonce(24)
	const c1Bare = `n=${username},r=${cNonce}`
	const c1Msg = gs2Header + c1Bare
	const c1Data = rstr2b64uri(c1Msg)

	const c1Res = await authReq(
		buildHeader(hello.name, c1Data, hello.params['handshaketoken'])
	)
	if (c1Res.status !== 401) {
		throw new Error('登录失败：用户名或密码错误')
	}
	const s1Auth = c1Res.headers.get('WWW-Authenticate')
	if (!s1Auth) throw new Error('登录失败：服务端未返回挑战数据')
	const scheme1 = parseWwwAuthenticate(s1Auth)
	const s1Msg = atob(scheme1.params['data'])
	const s1Data = decodeMsgParams(s1Msg)

	const channelBinding = `c=${rstr2b64(gs2Header)}`
	const nonceParam = `r=${s1Data['r']}`
	const c2NoProof = `${channelBinding},${nonceParam}`

	const salt = atob(s1Data['s'])
	const iterations = parseInt(s1Data['i'], 10)
	const saltedPassword = pbkdf2HmacSha256(password, salt, iterations, 32)
	const clientKey = hmacSha256(saltedPassword, 'Client Key')
	const storedKey = sha256(clientKey)
	const authMessage = `${c1Bare},${s1Msg},${c2NoProof}`
	const clientSignature = hmacSha256(storedKey, authMessage)
	const proof = rstr2b64(xor(clientKey, clientSignature))
	const c2Msg = `${c2NoProof},p=${proof}`
	const c2Data = rstr2b64uri(c2Msg)

	const finalRes = await authReq(
		buildHeader(hello.name, c2Data, scheme1.params['handshaketoken'])
	)
	if (finalRes.status !== 200) {
		throw new Error('登录失败：用户名或密码错误')
	}
}
