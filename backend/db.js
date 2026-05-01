const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data.json');

function defaultState() {
  return {
    nextUserId: 1,
    nextOtpId: 1,
    users: [],
    otps: []
  };
}

function loadState() {
  try {
    if (!fs.existsSync(dbPath)) {
      return defaultState();
    }
    return { ...defaultState(), ...JSON.parse(fs.readFileSync(dbPath, 'utf8')) };
  } catch (err) {
    console.error('Error reading auth data store:', err.message);
    return defaultState();
  }
}

let state = loadState();

function saveState() {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2));
}

function findVerifiedUserByEmail(email) {
  return state.users.find((user) => user.email === email && user.is_verified === 1) || null;
}

function findValidOtp(email, otpCode, type) {
  const now = Date.now();
  return state.otps
    .filter((otp) => (
      otp.email === email &&
      otp.otp_code === otpCode &&
      otp.type === type &&
      new Date(otp.expires_at).getTime() > now
    ))
    .sort((a, b) => b.id - a.id)[0] || null;
}

function asyncCallback(callback, err, result) {
  setImmediate(() => callback(err, result));
}

const db = {
  get(sql, params, callback) {
    try {
      let result = null;

      if (sql.includes('FROM users WHERE email = ? AND is_verified = 1')) {
        result = findVerifiedUserByEmail(params[0]);
      } else if (sql.includes('FROM otps WHERE email = ? AND otp_code = ? AND type = "signup"')) {
        result = findValidOtp(params[0], params[1], 'signup');
      } else if (sql.includes('FROM otps WHERE email = ? AND otp_code = ? AND type = "reset"')) {
        result = findValidOtp(params[0], params[1], 'reset');
      }

      asyncCallback(callback, null, result);
    } catch (err) {
      asyncCallback(callback, err);
    }
  },

  run(sql, params, callback = () => {}) {
    try {
      let changes = 0;
      let lastID = null;

      if (sql.startsWith('INSERT INTO otps')) {
        lastID = state.nextOtpId++;
        state.otps.push({
          id: lastID,
          email: params[0],
          otp_code: params[1],
          type: params[2],
          expires_at: params[3]
        });
        changes = 1;
      } else if (sql.startsWith('INSERT INTO users')) {
        const existing = state.users.find((user) => user.email === params[1]);
        if (existing) {
          existing.name = params[0];
          existing.password_hash = params[2];
          existing.is_verified = 1;
          changes = 1;
        } else {
          lastID = state.nextUserId++;
          state.users.push({
            id: lastID,
            name: params[0],
            email: params[1],
            password_hash: params[2],
            is_verified: 1,
            created_at: new Date().toISOString()
          });
          changes = 1;
        }
      } else if (sql.startsWith('DELETE FROM otps WHERE email = ? AND type = "signup"')) {
        const before = state.otps.length;
        state.otps = state.otps.filter((otp) => !(otp.email === params[0] && otp.type === 'signup'));
        changes = before - state.otps.length;
      } else if (sql.startsWith('DELETE FROM otps WHERE email = ? AND type = "reset"')) {
        const before = state.otps.length;
        state.otps = state.otps.filter((otp) => !(otp.email === params[0] && otp.type === 'reset'));
        changes = before - state.otps.length;
      } else if (sql.startsWith('UPDATE users SET password_hash = ? WHERE email = ?')) {
        const user = state.users.find((item) => item.email === params[1]);
        if (user) {
          user.password_hash = params[0];
          changes = 1;
        }
      }

      saveState();
      setImmediate(() => callback.call({ lastID, changes }, null));
    } catch (err) {
      setImmediate(() => callback(err));
    }
  }
};

console.log('Connected to JSON auth data store.');

module.exports = db;
