export type PasswordStrength = "Lemah" | "Sedang" | "Kuat";

export function normalizeAuthUsername(username: string) {
  return username.trim();
}

export function validateAuthUsername(username: string) {
  const normalizedUsername = normalizeAuthUsername(username);
  const errors: string[] = [];

  if (normalizedUsername.length < 3) {
    errors.push("Username minimal 3 karakter.");
  }

  if (normalizedUsername.length > 20) {
    errors.push("Username maksimal 20 karakter.");
  }

  if (normalizedUsername && !/^[a-z0-9]+$/.test(normalizedUsername)) {
    errors.push("Username hanya boleh berisi huruf kecil dan angka.");
  }

  return errors;
}

export function validateAuthPassword(password: string) {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password minimal 8 karakter.");
  }

  if (password.length > 64) {
    errors.push("Password maksimal 64 karakter.");
  }

  if (/\s/.test(password)) {
    errors.push("Password tidak boleh mengandung spasi.");
  }

  if (password && !/[A-Z]/.test(password)) {
    errors.push("Password wajib memiliki minimal 1 huruf besar.");
  }

  if (password && !/[0-9]/.test(password)) {
    errors.push("Password wajib memiliki minimal 1 angka.");
  }

  return errors;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9\s]/.test(password)) {
    score += 1;
  }

  if (score >= 5) {
    return "Kuat";
  }

  if (score >= 3) {
    return "Sedang";
  }

  return "Lemah";
}
