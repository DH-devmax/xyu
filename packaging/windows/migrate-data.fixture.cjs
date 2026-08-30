const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

// databasePath 是 Windows 迁移回归中已由新服务器创建的 SQLite 样本。
const databasePath = process.argv[2];
// dataKey 是 fixture 与新服务器共用的固定测试密钥，不包含生产凭证。
const dataKey = process.argv[3];
if (!databasePath || !dataKey) {
  throw new Error('用法: node migrate-data.fixture.cjs DATABASE DATA_KEY');
}

// key 使用与 Go secretCodec 相同的 SHA-256 密钥派生方式。
const key = crypto.createHash('sha256').update(dataKey).digest();
// nonce 是仅用于确定性 fixture 的固定 GCM nonce，不得用于生产加密。
const nonce = Buffer.alloc(12, 7);
// cipher 是与正式数据库编解码器相同的 AES-256-GCM 加密器。
const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
cipher.setAAD(Buffer.from('system-setting\0ai_api_key'));
// ciphertext 是固定测试明文的密文主体。
const ciphertext = Buffer.concat([cipher.update('fixture-secret'), cipher.final()]);
// sealed 按 Go 实现的 nonce、密文、认证标签顺序拼接完整信封。
const sealed = Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]);
// encryptedValue 使用正式 `enc:v1:` 前缀和无填充标准 Base64。
const encryptedValue = `enc:v1:${sealed.toString('base64').replace(/=+$/, '')}`;
// database 只修改新服务器生成的临时回归样本。
const database = new DatabaseSync(databasePath);
database.prepare("UPDATE system_settings SET value = ? WHERE key = 'ai_api_key'").run(encryptedValue);
database.close();
