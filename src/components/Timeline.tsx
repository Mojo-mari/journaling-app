import React, { useState, useRef, useEffect } from 'react';
import { type TimelineEvent } from '../db';
import { Clock, Trash2, X, RefreshCw } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { initGapi, listUpcomingEvents } from '../lib/googleCalendar';

interface TimelineProps {
  events: TimelineEvent[];
  onSave: (events: TimelineEvent[]) => void;
  selectedDate: Date;
}

const HOURS = Array.from({ length: 17 }, (_, i) => 6 + i); // 6:00 to 22:00
const SLOT_HEIGHT = 48; // Height of one hour in pixels
const SNAP_MINUTES = 15; // Snap to 15 minutes
const SNAP_HEIGHT = SLOT_HEIGHT / (60 / SNAP_MINUTES);

const ANALOG_COLORS = [
  'bg-[#748BA7]', // Muted Blue (Googleブルーをワントーン落とした色)
  'bg-[#8BA88B]', // Muted Green (落ち着いた緑)
  'bg-[#9B8BB1]', // Muted Purple (落ち着いた紫)
  'bg-[#B18B8B]', // Muted Rose (落ち着いた赤)
  'bg-[#96A4B1]', // Muted Slate
  'bg-[#A4B196]', // Muted Olive
  'bg-[#B1A496]', // Muted Sand
  'bg-[#A496B1]', // Muted Dust
];

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const Timeline: React.FC<TimelineProps> = ({ events, onSave, selectedDate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const isValidClientId = clientId && clientId.includes('.apps.googleusercontent.com');

  useEffect(() => {
    // クライアントIDがない、または形式が不正な場合は初期化をスキップ
    if (!isValidClientId) {
      if (clientId && clientId !== 'placeholder-client-id') {
        console.warn('Invalid Google Client ID format. It should end with .apps.googleusercontent.com');
      }
      return;
    }

    // エラーハンドリングを追加
    initGapi(clientId).catch((error) => {
      console.error('Failed to initialize GAPI:', error);
      // エラーが発生してもアプリは継続できるようにする
    });
  }, [clientId, isValidClientId]);

  // 編集開始時にテキストをセット
  useEffect(() => {
    if (editingEventId) {
      const event = events.find(e => e.id === editingEventId);
      setEditingText(event?.text || '');
    } else {
      setEditingText('');
    }
  }, [editingEventId, events]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        // GAPIの初期化を確実に確認
        await initGapi(clientId);

        // gapiにトークンを設定
        if ((window as any).gapi && (window as any).gapi.client) {
          (window as any).gapi.client.setToken({
            access_token: tokenResponse.access_token,
          });

          const googleEvents = await listUpcomingEvents(selectedDate);

          const newTimelineEvents: TimelineEvent[] = googleEvents.map((ge: any, index: number) => ({
            id: `google-${ge.id}`,
            startTime: formatTime(ge.start.dateTime || ge.start.date),
            endTime: formatTime(ge.end.dateTime || ge.end.date),
            text: ge.summary,
            // Googleの予定もアプリのテイストに合わせる
            color: ANALOG_COLORS[index % ANALOG_COLORS.length]
          }));

          const filteredEvents = events.filter(e => !e.id.startsWith('google-'));
          onSave([...filteredEvents, ...newTimelineEvents]);
        }
      } catch (error) {
        console.error('Sync error:', error);
        alert("An error occurred during Google Calendar synchronization. Please check your 'Authorized JavaScript origins' in the Google Cloud Console.");
      } finally {
        setIsSyncing(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      alert("Login failed. Please check your Client ID or browser popup blocker.");
    },
    scope: 'openid email profile https://www.googleapis.com/auth/calendar.events.readonly',
  });

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getMinutesFromY = (y: number) => {
    const slotIndex = Math.floor(y / SLOT_HEIGHT);
    const minuteInSlot = Math.floor((y % SLOT_HEIGHT) / SNAP_HEIGHT) * SNAP_MINUTES;
    return (HOURS[0] + slotIndex) * 60 + minuteInSlot;
  };

  // 重なりを計算して位置と幅を決定するロジック
  const positionedEvents = React.useMemo(() => {
    const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const positioned: (TimelineEvent & { leftOffset: number; widthPct: number })[] = [];

    // 予定をグループ化（重なっているもの同士）
    const groups: TimelineEvent[][] = [];
    let currentGroup: TimelineEvent[] = [];
    let lastEnd = 0;

    sorted.forEach(event => {
      const start = timeToMinutes(event.startTime);
      if (start >= lastEnd) {
        if (currentGroup.length > 0) groups.push(currentGroup);
        currentGroup = [event];
      } else {
        currentGroup.push(event);
      }
      lastEnd = Math.max(lastEnd, timeToMinutes(event.endTime));
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    // 各グループ内でカラムを割り当てる
    groups.forEach(group => {
      const columns: TimelineEvent[][] = [];
      group.forEach(event => {
        let placed = false;
        const start = timeToMinutes(event.startTime);
        for (let i = 0; i < columns.length; i++) {
          const lastInCol = columns[i][columns[i].length - 1];
          if (start >= timeToMinutes(lastInCol.endTime)) {
            columns[i].push(event);
            placed = true;
            break;
          }
        }
        if (!placed) columns.push([event]);
      });

      const colCount = columns.length;
      columns.forEach((col, idx) => {
        col.forEach(event => {
          positioned.push({
            ...event,
            leftOffset: idx / colCount,
            widthPct: 1 / colCount
          });
        });
      });
    });

    return positioned;
  }, [events]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editingEventId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top + containerRef.current!.scrollTop;
    const minutes = getMinutesFromY(y);

    setIsDragging(true);
    setDragStart(minutes);
    setDragCurrent(minutes + SNAP_MINUTES);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (editingEventId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.touches[0].clientY - rect.top + containerRef.current!.scrollTop;
    const minutes = getMinutesFromY(y);

    setIsDragging(true);
    setDragStart(minutes);
    setDragCurrent(minutes + SNAP_MINUTES);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top + containerRef.current!.scrollTop;
    const minutes = Math.max(dragStart + SNAP_MINUTES, getMinutesFromY(y));
    setDragCurrent(minutes);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStart === null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // タッチ中はスクロールを止める
    if (e.cancelable) e.preventDefault();

    const y = e.touches[0].clientY - rect.top + containerRef.current!.scrollTop;
    const minutes = Math.max(dragStart + SNAP_MINUTES, getMinutesFromY(y));
    setDragCurrent(minutes);
  };

  const handleMouseUp = () => {
    if (!isDragging || dragStart === null || dragCurrent === null) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const newEvent: TimelineEvent = {
      id: Math.random().toString(36).substring(2),
      startTime: minutesToTime(dragStart),
      endTime: minutesToTime(dragCurrent),
      text: '',
      color: ANALOG_COLORS[Math.floor(Math.random() * ANALOG_COLORS.length)]
    };

    onSave([...events, newEvent]);
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    setEditingEventId(newEvent.id);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const deleteEvent = (id: string) => {
    onSave(events.filter(e => e.id !== id));
    setEditingEventId(null);
  };

  const updateEventText = (id: string, text: string) => {
    onSave(events.map(e => e.id === id ? { ...e, text } : e));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 px-8">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 font-bold flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Timeline (Drag to create)
        </h2>
        <button
          onClick={() => {
            if (isValidClientId) {
              try {
                login();
              } catch (error) {
                console.error('Login invocation failed:', error);
                alert("Failed to start Google Login. Please verify your Google Client ID configuration.");
              }
            } else {
              alert("Google Client ID is invalid or not set. Please check your .env file and ensuring it matches *.apps.googleusercontent.com");
            }
          }}
          disabled={isSyncing}
          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${!isValidClientId ? 'text-rose-400 opacity-60' : 'text-paper-text/40 hover:text-paper-text'
            }`}
          title={!isValidClientId ? "Google Client ID invalid" : "Sync with Google Calendar"}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : isValidClientId ? 'Sync with Google' : 'Config Error'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-grow overflow-y-auto custom-scrollbar select-none pr-4 pl-16 touch-none"
        style={{ height: '700px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid lines */}
        {HOURS.map((hour) => (
          <div key={hour} className="relative h-[48px] border-t border-paper-border/10">
            <div className="absolute left-[-4rem] -top-2.5 w-12 text-right">
              <span className="text-[10px] font-bold text-paper-text/60">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
            <div className="absolute w-full top-1/2 border-t border-paper-border/5 border-dashed" />
          </div>
        ))}

        {/* Event Drawing Area (Only the grid part) */}
        <div className="absolute inset-0 left-16 right-0 pointer-events-none">
          {positionedEvents.map((event) => {
            const start = timeToMinutes(event.startTime);
            const end = timeToMinutes(event.endTime);
            const top = ((start - HOURS[0] * 60) / 60) * SLOT_HEIGHT;
            const height = ((end - start) / 60) * SLOT_HEIGHT;

            return (
              <div
                key={event.id}
                className={`absolute mx-0.5 rounded-lg border border-white/20 shadow-sm p-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:z-20 ${event.color || 'bg-paper-text/10'} text-white group pointer-events-auto`}
                style={{
                  top,
                  height,
                  left: `${event.leftOffset * 100}%`,
                  width: `calc(${event.widthPct * 100}% - 4px)`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingEventId(event.id);
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold opacity-80 leading-none">
                    {event.startTime} - {event.endTime}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 rounded transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-medium mt-1 leading-tight line-clamp-3">
                  {event.text || '(Click to edit)'}
                </p>
              </div>
            );
          })}

          {/* Drag Preview */}
          {isDragging && dragStart !== null && dragCurrent !== null && (
            <div
              className="absolute left-0 right-0 mx-1 bg-paper-text/20 rounded-lg border-2 border-dashed border-paper-text/30 pointer-events-none"
              style={{
                top: ((dragStart - HOURS[0] * 60) / 60) * SLOT_HEIGHT,
                height: ((dragCurrent - dragStart) / 60) * SLOT_HEIGHT
              }}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-text/20 backdrop-blur-sm" onClick={() => setEditingEventId(null)}>
          <div className="w-full max-w-sm bg-cream-50 rounded-2xl shadow-2xl border border-paper-border p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif italic font-bold text-paper-text">Edit Event</h3>
              <button onClick={() => setEditingEventId(null)} className="p-1 hover:bg-cream-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              autoFocus
              className="w-full bg-white border border-paper-border/30 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[100px] text-sm mb-4 shadow-inner"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              placeholder="What are you planning?"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => deleteEvent(editingEventId)}
                className="flex items-center px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
              <button
                onClick={() => {
                  updateEventText(editingEventId, editingText);
                  setEditingEventId(null);
                }}
                className="px-6 py-2 bg-paper-text text-cream-50 rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
