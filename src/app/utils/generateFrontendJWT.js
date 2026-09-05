

import jwtEncode from "jwt-encode";

export function generateFrontendJWT(payload, secret = "super_secret_key_123") {
  return jwtEncode(payload, secret);
}
