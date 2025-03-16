export interface Recommendation {
  entry: {
    mal_id: number;
    title: string;
    images: {
      jpg: {
        image_url: string;
      }
    }
  };
}
