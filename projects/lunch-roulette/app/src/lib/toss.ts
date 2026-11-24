// 토스 앱 기능을 감싼다. 토스 밖(일반 브라우저)에서는 브릿지가 없으므로 웹 대체 동작을 쓴다.
import { Share, Storage, getOperationalEnvironment } from '@apps-in-toss/web-framework';

export const APP_NAME = 'lunch-roulette-today';

let cachedInToss: boolean | null = null;
export function inToss(): boolean {
  if (cachedInToss !== null) return cachedInToss;
  try {
    const env = getOperationalEnvironment();
    cachedInToss = env === 'toss' || env === 'sandbox';
  } catch {
    cachedInToss = false;
  }
  return cachedInToss;
}

export async function loadItem(key: string): Promise<string | null> {
  if (inToss()) {
    try {
      return await Storage.getItem(key);
    } catch {
      /* 웹 저장소로 넘어간다 */
    }
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function saveItem(key: string, value: string): Promise<void> {
  if (inToss()) {
    try {
      await Storage.setItem(key, value);
      return;
    } catch {
      /* 웹 저장소로 넘어간다 */
    }
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 저장 못 해도 화면은 동작한다 */
  }
}

/** 친구에게 보낼 이 앱 링크. 토스 밖에서는 지금 주소. */
export async function appLink(): Promise<string> {
  if (inToss()) {
    try {
      return await Share.createLink({ path: `intoss://${APP_NAME}` });
    } catch {
      /* 링크 없이 문구만 보낸다 */
    }
  }
  return window.location.origin + window.location.pathname;
}

/** 메시지 공유. 성공하면 'shared', 복사로 대신했으면 'copied', 둘 다 실패하면 'failed' */
export async function shareText(message: string): Promise<'shared' | 'copied' | 'failed'> {
  if (inToss()) {
    try {
      await Share.sendMessage({ message });
      return 'shared';
    } catch {
      /* 복사로 넘어간다 */
    }
  }
  try {
    await navigator.clipboard.writeText(message);
    return 'copied';
  } catch {
    return 'failed';
  }
}
