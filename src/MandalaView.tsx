import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MandalaEntry } from './db';
import EditableField from './components/EditableField';
import { Target, Save, RotateCcw } from 'lucide-react';

const MandalaView: React.FC = () => {
    const mandalaId = 'main';
    const entry = useLiveQuery(() => db.mandalaEntries.get(mandalaId), []);

    // 3x3 grid indices for the center goal and 8 surrounding goals
    // Layout:
    // 0 1 2
    // 7 X 3
    // 6 5 4
    // Mapping to visual grid (3x3):
    // [0] [1] [2]   (Top-Left, Top-Center, Top-Right)
    // [7] [CENTER] [3] (Mid-Left, Center, Mid-Right)
    // [6] [5] [4]   (Bottom-Left, Bottom-Center, Bottom-Right)

    // Helper to create empty structure
    const createEmptyEntry = (): MandalaEntry => ({
        id: mandalaId,
        mainGoal: '',
        subGoals: Array.from({ length: 8 }).map(() => ({ text: '', items: Array.from({ length: 8 }).map(() => '') })),
        updatedAt: Date.now()
    });

    const [localEntry, setLocalEntry] = useState<MandalaEntry>(createEmptyEntry());
    const localEntryRef = useRef(localEntry);

    useEffect(() => {
        localEntryRef.current = localEntry;
    }, [localEntry]);

    useEffect(() => {
        if (entry) {
            // Sync only if not typing (simple check)
            if (!document.activeElement?.closest('textarea, input')) {
                setLocalEntry(entry);
            }
        } else if (entry === undefined) {
            // Loading
        } else {
            // Entry doesn't exist yet, initialized in local state
        }
    }, [entry]);

    const saveEntry = async (newEntry: MandalaEntry) => {
        await db.mandalaEntries.put({ ...newEntry, updatedAt: Date.now() });
    };

    const handleMainGoalChange = (val: string) => {
        setLocalEntry(prev => {
            const next = { ...prev, mainGoal: val };
            saveEntry(next); // Auto-save for simplicity or throttle
            return next;
        });
    };

    const handleSubGoalTextChange = (index: number, val: string) => {
        setLocalEntry(prev => {
            const next = { ...prev };
            next.subGoals[index].text = val;
            saveEntry(next);
            return next;
        });
    };

    const handleSubGoalItemChange = (subGoalIndex: number, itemIndex: number, val: string) => {
        setLocalEntry(prev => {
            const next = { ...prev };
            next.subGoals[subGoalIndex].items[itemIndex] = val;
            saveEntry(next);
            return next;
        });
    };

    // Helper to render a 3x3 grid
    // centerContent: ReactNode for the center cell
    // surroundingItems: Array of 8 items to place around
    // renderItem: (item: any, index: number) => ReactNode
    // className: string for the container
    const render3x3 = (
        centerContent: React.ReactNode,
        surroundingItems: any[],
        renderItem: (item: any, index: number) => React.ReactNode,
        containerClass: string = ""
    ) => {
        // 0 1 2
        // 7 C 3
        // 6 5 4

        // Grid rendering order:
        // Row 1: 0, 1, 2
        // Row 2: 7, Center, 3
        // Row 3: 6, 5, 4

        // items passed in are [0..7]
        const gridItems = [
            surroundingItems[0], surroundingItems[1], surroundingItems[2],
            surroundingItems[7], null, surroundingItems[3],
            surroundingItems[6], surroundingItems[5], surroundingItems[4]
        ];

        // For mapping back to original index [0..7]
        const indices = [
            0, 1, 2,
            7, -1, 3,
            6, 5, 4
        ];

        return (
            <div className={`grid grid-cols-3 gap-1 ${containerClass}`}>
                {gridItems.map((item, gridIndex) => {
                    const originalIndex = indices[gridIndex];
                    if (originalIndex === -1) {
                        return <div key="center" className="row-start-2 col-start-2 h-full w-full overflow-hidden">{centerContent}</div>;
                    }
                    return (
                        <div key={gridIndex} className="h-full w-full overflow-hidden">
                            {renderItem(item, originalIndex)}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Logic to render the entire Mandala
    // The layout is effectively a giant 3x3 grid of 3x3 grids.
    // The Center Grid (Main Goal + 8 Sub Goals) is at the Center of the giant grid.
    // The Outer Grids are the expanded DETAILS for each Sub Goal.

    // CENTER GRID (Middle of Middle):
    // Displays Main Goal (Center)
    // Displays 8 Sub Goals (Surrounding) -> THESE ARE AUTOMATICALLY SYNCED from the outer grids' centers (usually).
    // Standard behaviors: Sub Goal X's text IS the Center text of Outer Grid X.

    // Outer Grids:
    // Center cell: Sub Goal X text (Editable here or in the center grid - synced)
    // Surrounding cells: 8 actionable items for Sub Goal X.

    return (
        <div className="min-h-screen pb-20 overflow-x-auto">
            <header className="mb-4 border-b border-paper-border pb-4">
                <h1 className="text-3xl font-serif text-paper-text italic font-bold tracking-tight flex items-center gap-3">
                    <Target className="w-8 h-8 opacity-70" />
                    Mandala Chart
                </h1>
                <p className="text-sm text-paper-text/60 mt-1 ml-11 font-serif italic">
                    9x9 Grid for structuring complex goals (Manda-la)
                </p>
            </header>

            {/* Main Container - Centered and Fixed Aspect Ratio if possible, or scrollable */}
            <div className="min-w-[900px] max-w-[1200px] mx-auto p-4">
                {/* Big 3x3 Grid Wrapper */}
                {/* We reuse rendering logic. 
             Center Wrapper: The Summary Grid
             Outer Wrappers: The Detail Grids
         */}
                {render3x3(
                    // CENTER OF THE WHOLE CHART (THE SUMMARY GRID)
                    <div className="w-full h-full bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 flex flex-col p-1">
                        {render3x3(
                            // Center of the Summary Grid: THE MAIN GOAL
                            <div className="w-full h-full bg-amber-200 flex items-center justify-center p-1 text-center font-bold text-amber-900 text-sm">
                                <EditableField
                                    value={localEntry.mainGoal}
                                    onSave={handleMainGoalChange}
                                    onChange={handleMainGoalChange}
                                    placeholder="MAIN GOAL"
                                    type="textarea"
                                    className="w-full h-full bg-transparent text-center resize-none focus:outline-none placeholder:text-amber-900/30"
                                />
                            </div>,
                            // Surrounding of Summary Grid: THE SUB GOALS summaries
                            localEntry.subGoals,
                            (subGoal, idx) => (
                                <div className="w-full h-full bg-white flex items-center justify-center p-1 text-center text-xs border border-amber-100 font-semibold text-gray-700">
                                    {/* This is just a view/edit of the sub goal title */}
                                    <EditableField
                                        value={subGoal.text}
                                        onSave={(val) => handleSubGoalTextChange(idx, val)}
                                        onChange={(val) => handleSubGoalTextChange(idx, val)}
                                        placeholder={`Sub ${idx + 1}`}
                                        type="textarea"
                                        className="w-full h-full bg-transparent text-center resize-none focus:outline-none placeholder:text-gray-300"
                                    />
                                </div>
                            ),
                            "w-full h-full"
                        )}
                    </div>,

                    // SURROUNDING OUTER GRIDS (THE DETAIL GRIDS)
                    localEntry.subGoals,

                    (subGoal, subGoalIdx) => {
                        // Each outer grid corresponds to one subGoal
                        return (
                            <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col p-0.5">
                                {render3x3(
                                    // Center of Outer Grid: Same as Sub Goal Title
                                    <div className="w-full h-full bg-amber-50 flex items-center justify-center p-1 text-center font-bold text-gray-700 text-xs">
                                        <EditableField
                                            value={subGoal.text}
                                            onSave={(val) => handleSubGoalTextChange(subGoalIdx, val)}
                                            onChange={(val) => handleSubGoalTextChange(subGoalIdx, val)}
                                            placeholder={`Sub ${subGoalIdx + 1}`}
                                            type="textarea"
                                            className="w-full h-full bg-transparent text-center resize-none focus:outline-none placeholder:text-gray-300"
                                        />
                                    </div>,

                                    // Surrounding items: The 8 actionable items
                                    subGoal.items,
                                    (itemText, itemIdx) => (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center p-0.5 text-center text-[10px]">
                                            <EditableField
                                                value={itemText}
                                                onSave={(val) => handleSubGoalItemChange(subGoalIdx, itemIdx, val)}
                                                onChange={(val) => handleSubGoalItemChange(subGoalIdx, itemIdx, val)}
                                                placeholder="..."
                                                type="textarea"
                                                className="w-full h-full bg-transparent text-center resize-none focus:outline-none placeholder:text-gray-200"
                                            />
                                        </div>
                                    ),
                                    "w-full h-full gap-px"
                                )}
                            </div>
                        );
                    },

                    "gap-2 aspect-square"
                )}
            </div>

            <div className="text-center mt-8 space-x-4">
                <button
                    onClick={() => {
                        if (window.confirm('Clear all data on this chart?')) {
                            setLocalEntry(createEmptyEntry());
                            saveEntry(createEmptyEntry());
                        }
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm text-gray-600 hover:bg-gray-50 flex items-center inline-flex gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Reset Chart
                </button>
            </div>
        </div>
    );
};

export default MandalaView;
