export interface AnimeResult {
  data: Anime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

export interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  score: number;
  year: number;
  status: string;
  episodes: number;
  duration: string;
  rating: string;
  genres: { name: string }[];
  members?: number;
  favorites?: number;
  popularity?: number;
  rank?: number;
}