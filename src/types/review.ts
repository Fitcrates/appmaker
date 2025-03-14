export interface Review {
  mal_id: number;
  review: string;
  date: string;
  user: {
    username: string;
    images: {
      jpg: {
        image_url: string;
      }
    }
  };
  score: number;
  tags: string[];
}
