export type ThinoType = 'JOURNAL' | 'TASK-TODO' | 'TASK-DONE';

export interface ThinoNote {
  id: string;
  date: string;
  timestamp: string;
  thinoType: ThinoType;
  pinned: boolean;
  content: string;
}

export interface SeparatedContent {
  body: string;
  tags: string[];
}
