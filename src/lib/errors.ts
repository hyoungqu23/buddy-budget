export const mapUniqueNameError = (raw: string, tokens: string[] = []) => {
  const msg = String(raw ?? '');
  const checks = ['duplicate key', 'unique', ...tokens];
  return checks.some((t) => msg.includes(t)) ? '이미 존재하는 이름입니다' : undefined;
};
