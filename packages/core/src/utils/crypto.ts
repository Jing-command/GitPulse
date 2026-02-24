/**
 * 加密工具模块
 * 使用 AES-256-GCM 加密敏感数据（如 API Key）
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * 从环境变量获取或生成加密密钥
 * 生产环境必须在环境变量中设置 ENCRYPTION_KEY
 */
function getEncryptionKey(): Buffer {
  const keyFromEnv = process.env.ENCRYPTION_KEY;

  if (keyFromEnv) {
    // 如果提供了十六进制密钥，使用它
    if (keyFromEnv.length === 64) {
      return Buffer.from(keyFromEnv, 'hex');
    }
    // 否则使用 SHA-256 哈希生成密钥
    return crypto.createHash('sha256').update(keyFromEnv).digest();
  }

  // 开发环境：生成一个固定的密钥（仅用于开发！）
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Crypto] 使用开发环境固定密钥，生产环境请设置 ENCRYPTION_KEY');
    return crypto.createHash('sha256').update('gitpulse-dev-key-2024').digest();
  }

  throw new Error(
    'ENCRYPTION_KEY environment variable is required in production. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

/**
 * 加密文本
 * @param text 要加密的明文
 * @returns 格式: iv:authTag:ciphertext (base64)
 */
export function encrypt(text: string): string {
  if (!text) return '';

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // 组合: iv + authTag + ciphertext
    const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
    return result.toString('base64');
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 解密文本
 * @param encryptedData 格式: iv:authTag:ciphertext (base64)
 * @returns 明文
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  try {
    const data = Buffer.from(encryptedData, 'base64');

    // 提取组件
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw new Error('Failed to decrypt data - key may have changed or data is corrupted');
  }
}

/**
 * 生成随机加密密钥
 * 用于初始化时生成新的密钥
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * 检查加密是否可用（密钥是否正确配置）
 */
export function isEncryptionAvailable(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
