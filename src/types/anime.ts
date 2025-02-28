export interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
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
