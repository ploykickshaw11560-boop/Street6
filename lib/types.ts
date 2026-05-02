export type MoveCategory =
  | '通常技'
  | '特殊技'
  | '必殺技'
  | 'OD必殺技'
  | 'SA1'
  | 'SA2'
  | 'SA3'
  | '投げ'
  | 'その他';

export const MOVE_CATEGORIES: MoveCategory[] = [
  '通常技',
  '特殊技',
  '必殺技',
  'OD必殺技',
  'SA1',
  'SA2',
  'SA3',
  '投げ',
  'その他'
];

export type Character = {
  id: string;
  name: string;
  style_notes: string | null;
  health: number | null;
  walk_fwd: number | null;
  walk_bwd: number | null;
  dash_fwd_frames: number | null;
  dash_bwd_frames: number | null;
  dash_fwd_distance: number | null;
  dash_bwd_distance: number | null;
  pre_jump: number | null;
  archetype: string | null;
  created_at: string;
};

export type MasterMove = {
  id: string;
  character_id: string;
  move_name: string;
  command: string;
  category: MoveCategory;
  display_order: number;
  notes: string | null;
  created_at: string;
  character?: Pick<Character, 'name'>;
};

export type FrameData = {
  id: string;
  character_id: string;
  move_name: string;
  command: string;
  startup: number;
  active: number;
  recovery: number;
  on_hit: number;
  on_block: number;
  notes: string | null;
  created_at: string;
  character?: Pick<Character, 'name'>;
};

export type Combo = {
  id: string;
  character_id: string;
  combo_name: string;
  difficulty: 'Easy' | 'Normal' | 'Hard';
  damage: number;
  drive_gauge_change: number;
  combo_route: string;
  notes: string | null;
  created_at: string;
  character?: Pick<Character, 'name'>;
};
