import { sign, verify } from 'jsonwebtoken'

/**
 * This method should only be used in dev environment,
 * a private key should be used to sign these tokens in production
 */
const secret = "very secret"

interface verificationResult {
    id: string
}

export function generateJWT(id: number){
    return sign(
        {id},
        secret,
        {algorithm: 'HS256',expiresIn: '30d'}
    )
}

export function verifyJWT(token: string): verificationResult {
    let result = verify(
        token,
        secret,
        { algorithms: ['HS256']}
    )

    return result as verificationResult;
}