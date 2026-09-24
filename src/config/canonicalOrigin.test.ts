import { canonicalRedirectUrl } from './canonicalOrigin';

const fb = { projectId: 'fitnessapp-alonso', authDomain: 'fitnessapp-alonso.firebaseapp.com' };
const loc = (hostname: string, protocol = 'https:') => ({
  protocol,
  hostname,
  pathname: '/progreso/abc',
  search: '?x=1',
  hash: '',
});

describe('canonicalRedirectUrl', () => {
  it('moves web.app to the authDomain keeping the path', () => {
    expect(canonicalRedirectUrl(loc('fitnessapp-alonso.web.app'), fb)).toBe(
      'https://fitnessapp-alonso.firebaseapp.com/progreso/abc?x=1',
    );
  });

  it('does nothing on the canonical domain, localhost or other hosts', () => {
    expect(canonicalRedirectUrl(loc('fitnessapp-alonso.firebaseapp.com'), fb)).toBeNull();
    expect(canonicalRedirectUrl(loc('localhost', 'http:'), fb)).toBeNull();
    expect(canonicalRedirectUrl(loc('otro.web.app'), fb)).toBeNull();
  });

  it('does nothing when authDomain already is web.app', () => {
    expect(
      canonicalRedirectUrl(loc('fitnessapp-alonso.web.app'), {
        ...fb,
        authDomain: 'fitnessapp-alonso.web.app',
      }),
    ).toBeNull();
  });
});
