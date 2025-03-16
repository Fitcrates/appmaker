export interface Episode {
  mal_id: number;
  title: string;
  title_japanese?: string;
  aired?: string;
  score?: number;
  filler?: boolean;
  recap?: boolean;
  url?: string;
}

export interface EpisodeDetail extends Episode {
  synopsis?: string;
}

export interface EpisodesResponse {
  data: Episode[];
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items?: {
      count?: number;
      total?: number;
      per_page?: number;
    };
  };
}

export interface EpisodeDetailResponse {
  data: EpisodeDetail;
}
