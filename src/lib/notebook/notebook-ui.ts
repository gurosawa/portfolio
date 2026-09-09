export type NotebookPreferences = {
	readonly motionOff: boolean;
	toggleMotion: () => void;
};
export const notebookPreferenceContext = 'systems-notebook-preferences';
