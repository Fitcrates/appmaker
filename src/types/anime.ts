export interface Anime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
  };
  score?: number;
  scored_by?: number;
  year?: number;
  genres?: Genre[];
  studios?: Studio[];
  producers?: Creator[];
  rating?: string;
  members?: number;
  synopsis?: string;
  background?: string;
  status?: string;
  duration?: string;
  aired?: {
    from: string;
    to: string | null;
    string: string;
  };
  season?: string;
  episodes?: number;
  type?: string;
  source?: string;
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
  rank?: number;
  popularity?: number;
  favorites?: number;
}

export interface Genre {
  mal_id: number;
  name: string;
}

export interface Studio {
  mal_id: number;
  name: string;
}

export interface Creator {
  mal_id: number;
  name: string;
}
