export interface Episode {
  mal_id: number;
  title: string;
  episode: string;
  url: string;
  aired: string;
  score: number;
  filler: boolean;
  recap: boolean;
  forum_url: string;
  synopsis?: string;
}
