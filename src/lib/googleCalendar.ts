// gapi-scriptを動的に読み込む（エラーが発生してもアプリがクラッシュしないように）
let gapiModule: any = null;
let gapiLoadPromise: Promise<any> | null = null;

// gapiが利用可能か確認するヘルパー関数
const getGapi = async (): Promise<any> => {
  // window.gapiを優先的に使用
  if (typeof window !== 'undefined' && (window as any).gapi) {
    return (window as any).gapi;
  }

  // 既にモジュールが読み込まれている場合はそれを返す
  if (gapiModule) {
    return gapiModule.gapi;
  }

  // 読み込み中の場合は待機
  if (gapiLoadPromise) {
    try {
      const module = await gapiLoadPromise;
      return module?.gapi || null;
    } catch {
      return null;
    }
  }

  // 初回読み込み
  try {
    gapiLoadPromise = import('gapi-script');
    const module = await gapiLoadPromise;
    gapiModule = module;
    return module?.gapi || null;
  } catch (error) {
    console.warn('Failed to load gapi-script:', error);
    gapiLoadPromise = null;
    return null;
  }
};

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

export const initGapi = (clientId?: string) => {
  return new Promise(async (resolve) => {
    // クライアントIDがない場合はスキップ
    if (!clientId || clientId === 'placeholder-client-id') {
      resolve(false);
      return;
    }

    try {
      // gapiが利用可能か確認（非同期で取得）
      const gapiInstance = await getGapi();
      if (!gapiInstance) {
        console.warn('gapi-script is not loaded. Google Calendar features will be disabled.');
        resolve(false);
        return;
      }

      // すでに初期化されている場合はスキップ
      if (gapiInstance.client && gapiInstance.client.calendar) {
        resolve(true);
        return;
      }

      try {
        gapiInstance.load('client', {
          callback: async () => {
            try {
              await gapiInstance.client.init({
                clientId: clientId,
                discoveryDocs: DISCOVERY_DOCS,
                // scope はここでは指定せず、ログイン時の token に依存させる
              });
              resolve(true);
            } catch (error) {
              console.error('GAPI init error:', error);
              // エラーが発生してもアプリは継続できるようにする
              resolve(false);
            }
          },
          onerror: () => {
            console.error('GAPI load failed');
            // エラーが発生してもアプリは継続できるようにする
            resolve(false);
          }
        });
      } catch (error) {
        console.error('Error loading GAPI:', error);
        // エラーが発生してもアプリは継続できるようにする
        resolve(false);
      }
    } catch (error) {
      console.error('Error getting GAPI instance:', error);
      // エラーが発生してもアプリは継続できるようにする
      resolve(false);
    }
  });
};

export const listUpcomingEvents = async (date: Date) => {
  try {
    // gapiが利用可能か確認（非同期で取得）
    const gapiInstance = await getGapi();
    if (!gapiInstance || !gapiInstance.client || !gapiInstance.client.calendar) {
      console.warn('GAPI is not initialized. Cannot fetch calendar events.');
      return [];
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const response = await gapiInstance.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting GAPI instance for fetching events:', error);
    return [];
  }
};

