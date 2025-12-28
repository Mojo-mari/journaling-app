import { gapi } from 'gapi-script';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

export const initGapi = (clientId?: string) => {
  return new Promise((resolve, reject) => {
    // すでに初期化されている場合はスキップ
    if (gapi.client && gapi.client.calendar) {
      resolve(true);
      return;
    }

    gapi.load('client', {
      callback: async () => {
        try {
          await gapi.client.init({
            clientId: clientId,
            discoveryDocs: DISCOVERY_DOCS,
            // scope はここでは指定せず、ログイン時の token に依存させる
          });
          resolve(true);
        } catch (error) {
          console.error('GAPI init error:', error);
          reject(error);
        }
      },
      onerror: () => {
        reject(new Error('GAPI load failed'));
      }
    });
  });
};

export const listUpcomingEvents = async (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.result.items;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

