export type Character = {
  id: string;
  name: string;
  style_notes: string | null;
  created_at: string;
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
